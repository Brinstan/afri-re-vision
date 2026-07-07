// Fulfilment cash flows: expected claims and expenses, retro recoveries,
// simplified discounting, and the risk adjustment.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred, claimPaid } from '@/lib/actuarial';
import { FulfilmentCashFlows, Ifrs17Assumptions } from './types';
import { discountFactor, earnedFraction } from './assumptions';
import { riskAdjustment } from './riskAdjustment';

export const fulfilmentCashFlows = (
  treaties: Treaty[],
  claims: Claim[],
  assumptions: Ifrs17Assumptions,
  expectedLossRatioPct: number,
  totalIbnr: number
): FulfilmentCashFlows => {
  // Expected claims: outstanding case reserves + IBNR (incurred component)
  // plus expected claims on unearned exposure (remaining coverage component).
  const caseReserves = claims.reduce((s, c) => s + claimIncurred(c) - claimPaid(c), 0);
  const unearnedExpected = treaties.reduce((s, t) => {
    const unearned = 1 - earnedFraction(t, assumptions.valuationDate);
    return s + t.premium * unearned * expectedLossRatioPct / 100;
  }, 0);
  const expectedClaimsUndiscounted = caseReserves + totalIbnr + unearnedExpected;

  const expectedExpenses = treaties.reduce((s, t) => {
    const unearned = 1 - earnedFraction(t, assumptions.valuationDate);
    return s + t.premium * unearned * assumptions.expenseRatio / 100;
  }, 0);

  // Retro recoveries: recorded recoveries on claims + retro share of IBNR.
  const recordedRecoveries = claims.reduce((s, c) => s + (c.retroRecovery ?? 0), 0);
  const avgRetroPct = treaties.length > 0
    ? treaties.reduce((s, t) => s + t.retroPercentage, 0) / treaties.length
    : 0;
  const reinsuranceRecoveries = recordedRecoveries + totalIbnr * avgRetroPct / 100;

  const df = discountFactor(assumptions);
  const grossUndiscounted = expectedClaimsUndiscounted + expectedExpenses;
  const discountEffect = grossUndiscounted * (1 - df); // amount removed by discounting

  const discountedNet = grossUndiscounted * df - reinsuranceRecoveries * df;
  const ra = riskAdjustment(expectedClaimsUndiscounted, assumptions);

  return {
    expectedClaims: expectedClaimsUndiscounted,
    expectedExpenses,
    reinsuranceRecoveries,
    discountEffect,
    riskAdjustment: ra,
    totalFcf: discountedNet + ra
  };
};
