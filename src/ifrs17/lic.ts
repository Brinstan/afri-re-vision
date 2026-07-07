// Liability for Incurred Claims (LIC) roll-forward per treaty.
// LIC = case reserves (RBNS) + IBNR from the actuarial engine + risk adjustment,
// with paid claims running the balance off.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred, claimPaid } from '@/lib/actuarial';
import { Ifrs17Assumptions, LicRollForward } from './types';
import { riskAdjustment } from './riskAdjustment';

export const licRollForward = (
  treaty: Treaty,
  claims: Claim[],
  assumptions: Ifrs17Assumptions,
  /** IBNR allocated to this treaty from the actuarial engine. */
  ibnr: number
): LicRollForward => {
  const treatyClaims = claims.filter(c => c.treatyId === treaty.id);
  const claimsIncurred = treatyClaims.reduce((s, c) => s + claimIncurred(c), 0);
  const claimsPaid = treatyClaims.reduce((s, c) => s + claimPaid(c), 0);
  const caseReserves = claimsIncurred - claimsPaid;
  const ra = riskAdjustment(caseReserves + ibnr, assumptions);

  return {
    treatyId: treaty.id,
    treatyName: treaty.treatyName,
    openingBalance: 0,
    claimsIncurred,
    claimsPaid,
    ibnrMovement: ibnr,
    riskAdjustment: ra,
    closingBalance: caseReserves + ibnr + ra
  };
};

export const licTotals = (rows: LicRollForward[]) =>
  rows.reduce(
    (acc, r) => ({
      openingBalance: acc.openingBalance + r.openingBalance,
      claimsIncurred: acc.claimsIncurred + r.claimsIncurred,
      claimsPaid: acc.claimsPaid + r.claimsPaid,
      ibnrMovement: acc.ibnrMovement + r.ibnrMovement,
      riskAdjustment: acc.riskAdjustment + r.riskAdjustment,
      closingBalance: acc.closingBalance + r.closingBalance
    }),
    { openingBalance: 0, claimsIncurred: 0, claimsPaid: 0, ibnrMovement: 0, riskAdjustment: 0, closingBalance: 0 }
  );

/** Allocate portfolio-level IBNR to treaties in proportion to their case reserves (fallback: premium). */
export const allocateIbnr = (treaties: Treaty[], claims: Claim[], totalIbnr: number): Record<string, number> => {
  const weights = treaties.map(t => {
    const tc = claims.filter(c => c.treatyId === t.id);
    const reserves = tc.reduce((s, c) => s + claimIncurred(c) - claimPaid(c), 0);
    return { id: t.id, weight: reserves > 0 ? reserves : 0, premium: t.premium };
  });
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  const totalPremium = weights.reduce((s, w) => s + w.premium, 0);
  const out: Record<string, number> = {};
  weights.forEach(w => {
    const share = totalWeight > 0 ? w.weight / totalWeight : (totalPremium > 0 ? w.premium / totalPremium : 0);
    out[w.id] = totalIbnr * share;
  });
  return out;
};
