// Exposure rating: prices the structure from exposure (premium × prior loss
// ratio) rather than the account's own loss history.
//
// Non-proportional layers use a simplified power exposure curve
// G(x) = 1 − (1 − x)^c on the normalised loss scale — the share of ground-up
// losses expected below fraction x of the maximum loss. The layer's share of
// total losses is G(exhaust/MPL) − G(attach/MPL). This is a documented
// simplification of market exposure curves (no per-risk sum-insured profile
// exists in the data model).

import type { Claim, ExternalExperienceRow, Treaty } from '@/components/DataStore';
import { claimIncurred, inflate } from '@/lib/actuarial';
import { explodeLosses, scopeExternalRows } from './externalData';
import { MethodResult, PricingAssumptions, PricingStructure } from './types';

const exposureCurve = (x: number, c: number): number =>
  1 - Math.pow(1 - Math.min(1, Math.max(0, x)), c);

export const exposureRating = (
  claims: Claim[],
  treaties: Treaty[],
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  externalRows: ExternalExperienceRow[] = []
): MethodResult => {
  const expectedGroundUp = structure.subjectPremium * assumptions.expectedLossRatioPct / 100;

  switch (structure.treatyType) {
    case 'Quota Share':
    case 'Surplus': {
      const lossCost = expectedGroundUp * (structure.cessionPct ?? 0) / 100;
      return {
        method: 'exposure',
        lossCost,
        lossCostRatePct: structure.subjectPremium > 0 ? (lossCost / structure.subjectPremium) * 100 : null,
        note: `Subject premium × ELR ${assumptions.expectedLossRatioPct}% × cession ${(structure.cessionPct ?? 0)}%`,
        usable: (structure.cessionPct ?? 0) > 0
      };
    }
    case 'Stop Loss': {
      // Cover width as share of premium, applied to the tail beyond the attachment LR
      const attach = (structure.lrAttachPct ?? 0) / 100;
      const exhaust = (structure.lrExhaustPct ?? 0) / 100;
      const elr = assumptions.expectedLossRatioPct / 100;
      // Simplified: expected excess over the attachment loss ratio, capped at cover width,
      // assuming losses concentrate around the ELR with the curve as spread proxy
      const excess = Math.max(0, elr - attach);
      const width = Math.max(0, exhaust - attach);
      const lossCost = structure.subjectPremium * Math.min(excess, width);
      return {
        method: 'exposure',
        lossCost,
        lossCostRatePct: structure.subjectPremium > 0 ? (lossCost / structure.subjectPremium) * 100 : null,
        note: `Expected LR ${assumptions.expectedLossRatioPct}% vs attachment ${structure.lrAttachPct}% (deterministic excess, no volatility distribution)`,
        usable: width > 0
      };
    }
    default: { // XOL / Catastrophe / Facultative
      const att = structure.attachment ?? 0;
      const lim = structure.limit ?? 0;
      if (lim <= 0) {
        return { method: 'exposure', lossCost: 0, lossCostRatePct: null, note: 'Layer limit required', usable: false };
      }
      // MPL proxy: largest trended historical loss in scope, floored at layer exhaustion
      const scopeTreatyIds = new Set(
        treaties.filter(t => structure.linkedTreatyId
          ? t.id === structure.linkedTreatyId
          : structure.linesOfBusiness.length === 0 || t.lineOfBusiness.some(l => structure.linesOfBusiness.includes(l))
        ).map(t => t.id));
      const maxLoss = Math.max(
        att + lim,
        ...claims.filter(c => scopeTreatyIds.has(c.treatyId))
          .map(c => inflate(claimIncurred(c), new Date(c.dateOfLoss).getFullYear(), assumptions.claimsInflationPct)),
        ...scopeExternalRows(externalRows, structure)
          .flatMap(row => explodeLosses(row).map(loss => inflate(loss, row.year, assumptions.claimsInflationPct)))
      );
      const c = assumptions.exposureCurveExponent;
      const layerShare = exposureCurve((att + lim) / maxLoss, c) - exposureCurve(att / maxLoss, c);
      const lossCost = expectedGroundUp * layerShare;
      return {
        method: 'exposure',
        lossCost,
        lossCostRatePct: structure.subjectPremium > 0 ? (lossCost / structure.subjectPremium) * 100 : null,
        note: `Power curve (c=${c}) on MPL ${Math.round(maxLoss).toLocaleString()}: layer share ${(layerShare * 100).toFixed(1)}% of ground-up ELR losses`,
        usable: true
      };
    }
  }
};
