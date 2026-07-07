// Risk adjustment for non-financial risk — three configurable approaches.

import { Ifrs17Assumptions } from './types';

/** Confidence-level multipliers applied to reserves (simplified lognormal-style loadings). */
const CONFIDENCE_LOADINGS: Record<number, number> = {
  65: 0.05,
  75: 0.10,
  85: 0.18,
  95: 0.30
};

/**
 * Risk adjustment on a reserve base.
 * - percentOfReserves: reserves x user percentage
 * - confidenceLevel: reserves x loading for the chosen confidence level
 * - costOfCapital (placeholder): capital proxy (25% of reserves) x CoC rate x
 *   assumed 2-year run-off duration
 */
export const riskAdjustment = (reserveBase: number, assumptions: Ifrs17Assumptions): number => {
  if (reserveBase <= 0) return 0;
  switch (assumptions.riskAdjustmentMethod) {
    case 'percentOfReserves':
      return reserveBase * assumptions.riskAdjustmentPercent / 100;
    case 'confidenceLevel':
      return reserveBase * (CONFIDENCE_LOADINGS[assumptions.confidenceLevel] ?? 0.10);
    case 'costOfCapital':
      return reserveBase * 0.25 * (assumptions.costOfCapitalRate / 100) * 2;
  }
};

export const riskAdjustmentMethodLabel = (a: Ifrs17Assumptions): string => {
  switch (a.riskAdjustmentMethod) {
    case 'percentOfReserves': return `${a.riskAdjustmentPercent}% of reserves`;
    case 'confidenceLevel': return `Confidence level ${a.confidenceLevel}% (loading ${(CONFIDENCE_LOADINGS[a.confidenceLevel] ?? 0.1) * 100}%)`;
    case 'costOfCapital': return `Cost of capital ${a.costOfCapitalRate}% p.a. (placeholder)`;
  }
};
