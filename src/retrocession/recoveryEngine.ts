// Recovery calculation engine.
//
// For every inward claim, allocates the gross loss across the retro programme
// layers (XOL-style attachment/limit for non-proportional; cession % for
// proportional), nets off settled retro claims, and derives outstanding and
// reserve figures. Recomputes automatically as claims or retro claims change.

import type { Claim, RetroClaim, RetroProgramme, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { ClaimRecovery } from './types';

const programmeAppliesTo = (programme: RetroProgramme, treaty: Treaty | undefined, claim: Claim): boolean => {
  if (!treaty) return false;
  const inPeriod = claim.dateOfLoss >= programme.effectiveDate && claim.dateOfLoss <= programme.expiryDate;
  const lobMatch = programme.linesOfBusiness.length === 0 ||
    treaty.lineOfBusiness.some(lob => programme.linesOfBusiness.includes(lob));
  return inPeriod && lobMatch && programme.status === 'Active';
};

/**
 * Allocate one claim's gross loss to a programme's layers.
 * Proportional (Quota Share/Surplus): recoverable = gross × cession %.
 * Non-proportional: classic attachment/limit tranching above the retention.
 */
const allocateToProgramme = (
  grossLoss: number,
  programme: RetroProgramme
): Array<{ layerId: string; layerName: string; retention: number; recoverable: number }> => {
  const isProportional = programme.type === 'Quota Share' || programme.type === 'Surplus';

  if (isProportional) {
    const layer = programme.layers[0];
    if (!layer) return [];
    const recoverable = grossLoss * (programme.cessionPct ?? 0) / 100;
    return [{ layerId: layer.id, layerName: layer.name, retention: grossLoss - recoverable, recoverable }];
  }

  return programme.layers
    .map(layer => {
      const excessOverAttachment = Math.max(0, grossLoss - layer.attachmentPoint);
      const recoverable = Math.min(excessOverAttachment, layer.limit);
      return { layerId: layer.id, layerName: layer.name, retention: Math.min(grossLoss, layer.attachmentPoint), recoverable };
    })
    .filter(a => a.recoverable > 0);
};

/**
 * Recovery rows: one per claim × programme × layer with a positive recoverable.
 * `paidRecovery` comes from settled RetroClaims; `recoveryReserve` loads the
 * outstanding recovery with the portfolio IBNR-to-incurred ratio so reserves
 * move with the actuarial engine (reuse, not recreation).
 */
export const computeRecoveries = (
  claims: Claim[],
  treaties: Treaty[],
  programmes: RetroProgramme[],
  retroClaims: RetroClaim[],
  ibnrToIncurredRatio: number
): ClaimRecovery[] => {
  const treatyById = new Map(treaties.map(t => [t.id, t]));
  const rows: ClaimRecovery[] = [];

  claims.forEach(claim => {
    const treaty = treatyById.get(claim.treatyId);
    const grossLoss = claimIncurred(claim);
    if (grossLoss <= 0) return;

    programmes.forEach(programme => {
      if (!programmeAppliesTo(programme, treaty, claim)) return;

      allocateToProgramme(grossLoss, programme).forEach(allocation => {
        const settled = retroClaims
          .filter(rc => rc.originalClaimId === claim.id && rc.programmeId === programme.id &&
                        rc.layerId === allocation.layerId && rc.status === 'Settled')
          .reduce((s, rc) => s + rc.settledRecovery, 0);

        const expectedRecovery = allocation.recoverable;
        const outstanding = Math.max(0, expectedRecovery - settled);

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
          expectedRecovery,
          paidRecovery: settled,
          outstandingRecovery: outstanding,
          recoveryReserve: outstanding * (1 + Math.max(0, ibnrToIncurredRatio)),
          netRetainedLoss: grossLoss - expectedRecovery,
          currency: claim.currency
        });
      });
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
