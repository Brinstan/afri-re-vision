// IFRS 17 assumption management: defaults, persistence, and helpers that
// distinguish user-set assumptions from values calculated by the engine.

import { Ifrs17Assumptions, MeasurementModel } from './types';
import type { Treaty } from '@/components/DataStore';

export const IFRS17_ASSUMPTIONS_KEY = 'afrirevision-ifrs17-assumptions';

export const DEFAULT_IFRS17_ASSUMPTIONS: Ifrs17Assumptions = {
  valuationDate: new Date().toISOString().split('T')[0],
  discountRate: 8.0,
  riskAdjustmentMethod: 'percentOfReserves',
  riskAdjustmentPercent: 8.0,
  confidenceLevel: 75,
  costOfCapitalRate: 6.0,
  expenseRatio: 5.0,
  reportingCurrency: 'USD',
  modelOverrides: {}
};

export const loadAssumptions = (): Ifrs17Assumptions => {
  try {
    const saved = localStorage.getItem(IFRS17_ASSUMPTIONS_KEY);
    return saved ? { ...DEFAULT_IFRS17_ASSUMPTIONS, ...JSON.parse(saved) } : DEFAULT_IFRS17_ASSUMPTIONS;
  } catch {
    return DEFAULT_IFRS17_ASSUMPTIONS;
  }
};

export const saveAssumptions = (a: Ifrs17Assumptions) =>
  localStorage.setItem(IFRS17_ASSUMPTIONS_KEY, JSON.stringify(a));

/**
 * Measurement model for a treaty: explicit override wins, otherwise PAA
 * eligibility (coverage period of 12 months or less), else GMM.
 */
export const measurementModel = (treaty: Treaty, assumptions: Ifrs17Assumptions): MeasurementModel => {
  const override = assumptions.modelOverrides[treaty.id];
  if (override) return override;
  const inception = new Date(treaty.inceptionDate).getTime();
  const expiry = new Date(treaty.expiryDate).getTime();
  const months = (expiry - inception) / (1000 * 60 * 60 * 24 * 30.44);
  return months <= 12.5 ? 'PAA' : 'GMM';
};

/** Fraction of the coverage period elapsed at the valuation date, clamped to [0, 1]. */
export const earnedFraction = (treaty: Treaty, valuationDate: string): number => {
  const inception = new Date(treaty.inceptionDate).getTime();
  const expiry = new Date(treaty.expiryDate).getTime();
  const valuation = new Date(valuationDate).getTime();
  if (isNaN(inception) || isNaN(expiry) || expiry <= inception) return 1;
  return Math.min(1, Math.max(0, (valuation - inception) / (expiry - inception)));
};

/** Simplified single-period discount factor at an assumed one-year mean payout duration. */
export const discountFactor = (assumptions: Ifrs17Assumptions): number =>
  1 / (1 + assumptions.discountRate / 100);
