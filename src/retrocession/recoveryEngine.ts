// Recovery calculation engine — type-aware.
//
// Each retro arrangement type recovers on its own basis:
//   Quota Share   gross × cession %, per claim (capped at the event limit)
//   Surplus       gross × estimated average cession %, per claim
//   XOL / Cat / Facultative
//                 per-claim attachment/limit tranching; facultative is
//                 restricted to its linked inward treaty
//   Stop Loss     AGGREGATE basis: losses beyond an attachment expressed as a
//                 loss ratio % of live subject premium, up to the limit LR %
//   Aggregate     AGGREGATE basis: monetary annual attachment/limit
//
// Aggregate-basis recoveries are computed on the covered portfolio and then
// allocated back to individual claims pro-rata by gross loss so the register
// still shows one row per claim. Everything recomputes as claims change.

import type { Claim, RetroClaim, RetroProgramme, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { ClaimRecovery } from './types';

/** Inward treaties that fall into a programme's cover (LOB + period + fac link). */
export const coveredTreaties = (programme: RetroProgramme, treaties: Treaty[]): Treaty[] =>
  treaties.filter(t => {
    if (programme.linkedTreatyId) return t.id === programme.linkedTreatyId;
    const lobMatch = programme.linesOfBusiness.length === 0 ||
      t.lineOfBusiness.some(lob => programme.linesOfBusiness.includes(lob));
    // Treaty coverage period must overlap the programme period
    const overlaps = t.inceptionDate <= programme.expiryDate && t.expiryDate >= programme.effectiveDate;
    return lobMatch && overlaps;
  });

/** Subject premium: written premium of the covered inward treaties. */
export const subjectPremium = (programme: RetroProgramme, treaties: Treaty[]): number =>
  coveredTreaties(programme, treaties).reduce((s, t) => s + t.premium, 0);

const claimCovered = (programme: RetroProgramme, claim: Claim, treaty: Treaty | undefined): boolean => {
  if (!treaty || programme.status !== 'Active') return false;
  if (programme.linkedTreatyId && treaty.id !== programme.linkedTreatyId) return false;
  const inPeriod = claim.dateOfLoss >= programme.effectiveDate && claim.dateOfLoss <= programme.expiryDate;
  const lobMatch = programme.linesOfBusiness.length === 0 ||
    treaty.lineOfBusiness.some(lob => programme.linesOfBusiness.includes(lob));
  return inPeriod && lobMatch;
};

interface Allocation { layerId: string; layerName: string; retention: number; recoverable: number }

/** Per-claim allocation for the per-risk arrangement types. */
const allocatePerClaim = (grossLoss: number, programme: RetroProgramme): Allocation[] => {
  switch (programme.type) {
    case 'Quota Share':
    case 'Surplus': {
      const layer = programme.layers[0];
      if (!layer) return [];
      const cession = (programme.cessionPct ?? 0) / 100;
      // Event limit: the layer limit caps any one loss's cession
      const recoverable = Math.min(grossLoss * cession, layer.limit);
      return recoverable > 0
        ? [{ layerId: layer.id, layerName: layer.name, retention: grossLoss - recoverable, recoverable }]
        : [];
    }
    default: { // XOL, Catastrophe, Facultative — attachment/limit tranching
      return programme.layers
        .map(layer => {
          const excess = Math.max(0, grossLoss - layer.attachmentPoint);
          const recoverable = Math.min(excess, layer.limit);
          return { layerId: layer.id, layerName: layer.name, retention: Math.min(grossLoss, layer.attachmentPoint), recoverable };
        })
        .filter(a => a.recoverable > 0);
    }
  }
};

export const computeRecoveries = (
  claims: Claim[],
  treaties: Treaty[],
  programmes: RetroProgramme[],
  retroClaims: RetroClaim[],
  ibnrToIncurredRatio: number
): ClaimRecovery[] => {
  const treatyById = new Map(treaties.map(t => [t.id, t]));
  const rows: ClaimRecovery[] = [];

  const settledFor = (claimId: string, programmeId: string, layerId: string): number =>
    retroClaims
      .filter(rc => rc.originalClaimId === claimId && rc.programmeId === programmeId &&
                    rc.layerId === layerId && rc.status === 'Settled')
      .reduce((s, rc) => s + rc.settledRecovery, 0);

  const pushRow = (
    claim: Claim, treaty: Treaty | undefined, programme: RetroProgramme,
    allocation: Allocation, grossLoss: number
  ) => {
    const settled = settledFor(claim.id, programme.id, allocation.layerId);
    const outstanding = Math.max(0, allocation.recoverable - settled);
    rows.push({
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      treatyName: treaty?.treatyName ?? claim.contractNumber,
      programmeId: programme.id,
      programmeCode: programme.programmeCode,
      layerId: allocation.layerId,
      layerName: allocation.layerName,
      grossLoss,
      retention: allocation.retention,
      recoverableAmount: allocation.recoverable,
      expectedRecovery: allocation.recoverable,
      paidRecovery: settled,
      outstandingRecovery: outstanding,
      recoveryReserve: outstanding * (1 + Math.max(0, ibnrToIncurredRatio)),
      netRetainedLoss: grossLoss - allocation.recoverable,
      currency: claim.currency
    });
  };

  programmes.forEach(programme => {
    const isAggregateBasis = programme.type === 'Stop Loss' || programme.type === 'Aggregate';
    const covered = claims
      .map(c => ({ claim: c, treaty: treatyById.get(c.treatyId), gross: claimIncurred(c) }))
      .filter(x => x.gross > 0 && claimCovered(programme, x.claim, x.treaty));

    if (covered.length === 0) return;

    if (!isAggregateBasis) {
      covered.forEach(({ claim, treaty, gross }) => {
        allocatePerClaim(gross, programme).forEach(allocation =>
          pushRow(claim, treaty, programme, allocation, gross));
      });
      return;
    }

    // ---- Aggregate basis (Stop Loss / Aggregate) ----
    const layer = programme.layers[0];
    if (!layer) return;

    const aggLosses = covered.reduce((s, x) => s + x.gross, 0);
    let attachment: number;
    let limitAmt: number;

    if (programme.type === 'Stop Loss') {
      // Attachment and exhaustion as loss ratios of LIVE subject premium
      const subject = subjectPremium(programme, treaties);
      attachment = subject * (programme.lossRatioAttachmentPct ?? 0) / 100;
      const exhaustion = subject * (programme.lossRatioLimitPct ?? 0) / 100;
      limitAmt = Math.max(0, exhaustion - attachment);
    } else {
      attachment = programme.aggregateAttachment ?? layer.attachmentPoint;
      limitAmt = programme.aggregateLimit ?? layer.limit;
    }

    const totalRecovery = Math.min(Math.max(0, aggLosses - attachment), limitAmt);
    if (aggLosses <= 0) return;

    // Allocate the aggregate recovery back to claims pro-rata by gross loss
    covered.forEach(({ claim, treaty, gross }) => {
      const share = gross / aggLosses;
      const recoverable = totalRecovery * share;
      pushRow(claim, treaty, programme, {
        layerId: layer.id,
        layerName: layer.name,
        retention: gross - recoverable,
        recoverable
      }, gross);
    });
  });

  return rows;
};

export const recoveryTotals = (rows: ClaimRecovery[]) => ({
  grossLoss: rows.reduce((s, r) => s + r.grossLoss, 0),
  expected: rows.reduce((s, r) => s + r.expectedRecovery, 0),
  paid: rows.reduce((s, r) => s + r.paidRecovery, 0),
  outstanding: rows.reduce((s, r) => s + r.outstandingRecovery, 0),
  reserve: rows.reduce((s, r) => s + r.recoveryReserve, 0),
  netRetained: rows.reduce((s, r) => s + r.netRetainedLoss, 0)
});
