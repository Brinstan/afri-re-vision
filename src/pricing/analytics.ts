// Portfolio pricing analytics: rate adequacy of the in-force book against the
// current pricing basis, by line of business.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { PricingAssumptions } from './types';

export interface RateAdequacyRow {
  lineOfBusiness: string;
  treatyCount: number;
  bookedPremium: number;
  incurredLosses: number;
  actualLossRatioPct: number | null;
  /** Premium the current basis would require: losses grossed up for loadings. */
  requiredPremium: number;
  adequacyPct: number | null;       // booked / required — <100% means under-priced
  verdict: 'Adequate' | 'Marginal' | 'Inadequate' | 'No data';
}

export const rateAdequacyByLob = (
  treaties: Treaty[],
  claims: Claim[],
  assumptions: PricingAssumptions
): RateAdequacyRow[] => {
  const lobs = Array.from(new Set(treaties.flatMap(t => t.lineOfBusiness))).sort();
  const loadingDivisor = Math.max(0.01, 1 - (assumptions.expenseLoadingPct + assumptions.commissionLoadingPct + assumptions.profitLoadingPct) / 100);

  return lobs.map(lob => {
    const lobTreaties = treaties.filter(t => t.lineOfBusiness.includes(lob));
    const ids = new Set(lobTreaties.map(t => t.id));
    const bookedPremium = lobTreaties.reduce((s, t) => s + t.premium, 0);
    const incurred = claims.filter(c => ids.has(c.treatyId)).reduce((s, c) => s + claimIncurred(c), 0);

    // Expected losses: max of actual incurred and the ELR prior (prudent)
    const expectedLosses = Math.max(incurred, bookedPremium * assumptions.expectedLossRatioPct / 100);
    const required = expectedLosses * (1 + assumptions.riskLoadingPct / 100) / loadingDivisor;
    const adequacy = required > 0 ? (bookedPremium / required) * 100 : null;

    return {
      lineOfBusiness: lob,
      treatyCount: lobTreaties.length,
      bookedPremium,
      incurredLosses: incurred,
      actualLossRatioPct: bookedPremium > 0 ? (incurred / bookedPremium) * 100 : null,
      requiredPremium: required,
      adequacyPct: adequacy,
      verdict: adequacy === null ? 'No data' : adequacy >= 100 ? 'Adequate' : adequacy >= 85 ? 'Marginal' : 'Inadequate'
    };
  });
};
