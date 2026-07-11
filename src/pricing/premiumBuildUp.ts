// Premium build-up: expected loss cost → technical premium → office premium.
//
// Office premium uses the standard loading division so that expense,
// commission and profit are percentages OF the office premium:
//   office = technical / (1 − expense% − commission% − profit%)

import { PremiumBuildUp, PricingAssumptions, PricingStructure } from './types';

export const buildUpPremium = (
  expectedLossCost: number,
  structure: PricingStructure,
  assumptions: PricingAssumptions
): PremiumBuildUp => {
  const riskLoading = expectedLossCost * assumptions.riskLoadingPct / 100;
  const technicalPremium = expectedLossCost + riskLoading;

  const loadingsSumPct = assumptions.expenseLoadingPct + assumptions.commissionLoadingPct + assumptions.profitLoadingPct;
  const divisor = Math.max(0.01, 1 - loadingsSumPct / 100);
  const officePremium = technicalPremium / divisor;

  const expenseLoading = officePremium * assumptions.expenseLoadingPct / 100;
  const commissionLoading = officePremium * assumptions.commissionLoadingPct / 100;
  const profitLoading = officePremium * assumptions.profitLoadingPct / 100;

  const nonProportional = ['XOL', 'Catastrophe', 'Facultative'].includes(structure.treatyType);

  return {
    expectedLossCost,
    riskLoading,
    technicalPremium,
    expenseLoading,
    commissionLoading,
    profitLoading,
    officePremium,
    ratePct: structure.subjectPremium > 0 ? (officePremium / structure.subjectPremium) * 100 : null,
    rateOnLinePct: nonProportional && (structure.limit ?? 0) > 0
      ? (officePremium / (structure.limit as number)) * 100
      : null,
    loadingsSumPct
  };
};
