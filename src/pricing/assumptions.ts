// Pricing assumptions: defaults + persistence (mirrors the ifrs17/actuarial pattern).

import { PricingAssumptions } from './types';

export const PRICING_ASSUMPTIONS_KEY = 'afrirevision-pricing-assumptions';
export const PRICING_HISTORY_KEY = 'afrirevision-pricing-history';

export const DEFAULT_PRICING_ASSUMPTIONS: PricingAssumptions = {
  claimsInflationPct: 5.0,
  premiumTrendPct: 3.0,
  expectedLossRatioPct: 65,
  riskLoadingPct: 10,
  expenseLoadingPct: 5,
  commissionLoadingPct: 22.5,
  profitLoadingPct: 10,
  fullCredibilityClaims: 30,
  exposureCurveExponent: 1.6
};

export const loadPricingAssumptions = (): PricingAssumptions => {
  try {
    const saved = localStorage.getItem(PRICING_ASSUMPTIONS_KEY);
    return saved ? { ...DEFAULT_PRICING_ASSUMPTIONS, ...JSON.parse(saved) } : DEFAULT_PRICING_ASSUMPTIONS;
  } catch { return DEFAULT_PRICING_ASSUMPTIONS; }
};

export const savePricingAssumptions = (a: PricingAssumptions) =>
  localStorage.setItem(PRICING_ASSUMPTIONS_KEY, JSON.stringify(a));
