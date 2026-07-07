// Draft IFRS 17 financial statements and reinsurance issued/held summaries,
// derived from the LRC/LIC roll-forwards and live treaty/claim data.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred, claimPaid } from '@/lib/actuarial';
import {
  FinancialStatements, Ifrs17Assumptions, LicRollForward, LrcRollForward,
  PortfolioPerformanceRow, ReinsuranceHeld, ReinsuranceIssued
} from './types';
import { earnedFraction } from './assumptions';

export const reinsuranceIssued = (
  treaties: Treaty[],
  claims: Claim[],
  assumptions: Ifrs17Assumptions
): ReinsuranceIssued => {
  const premium = treaties.reduce((s, t) => s + t.premium, 0);
  const premiumReceived = treaties.reduce(
    (s, t) => s + (t.premiumBookings ?? []).reduce((bs, b) => bs + (b.paidAmount ?? 0), 0), 0);
  const revenue = treaties.reduce((s, t) => s + t.premium * earnedFraction(t, assumptions.valuationDate), 0);
  const claimsIncurred = claims.reduce((s, c) => s + claimIncurred(c), 0);
  const claimsPaid = claims.reduce((s, c) => s + claimPaid(c), 0);
  const commission = treaties.reduce((s, t) => s + t.premium * t.commission / 100 * earnedFraction(t, assumptions.valuationDate), 0);
  const expenses = commission + revenue * assumptions.expenseRatio / 100;

  return {
    premium,
    premiumReceived,
    claimsIncurred,
    claimsPaid,
    revenue,
    expenses,
    serviceResult: revenue - claimsIncurred - expenses
  };
};

export const reinsuranceHeld = (treaties: Treaty[], claims: Claim[], assumptions: Ifrs17Assumptions): ReinsuranceHeld => {
  const cededPremium = treaties.reduce(
    (s, t) => s + t.premium * (t.retroPercentage / 100) * earnedFraction(t, assumptions.valuationDate), 0);
  const recoveries = claims.reduce((s, c) => s + (c.retroRecovery ?? 0), 0);
  return { cededPremium, recoveries, netRetroCost: cededPremium - recoveries };
};

export const financialStatements = (
  issued: ReinsuranceIssued,
  held: ReinsuranceHeld,
  licClosing: number,
  raTotal: number,
  assumptions: Ifrs17Assumptions
): FinancialStatements => {
  const insuranceServiceExpenses = issued.claimsIncurred + issued.expenses + raTotal;
  const insuranceServiceResult = issued.revenue - insuranceServiceExpenses;
  // Simplified finance expense: unwind of discount on the incurred-claims liability.
  const insuranceFinanceExpense = licClosing * assumptions.discountRate / 100;
  const reinsuranceHeldResult = held.recoveries - held.cededPremium;

  return {
    insuranceRevenue: issued.revenue,
    insuranceServiceExpenses,
    insuranceServiceResult,
    insuranceFinanceExpense,
    reinsuranceHeldResult,
    technicalResult: insuranceServiceResult - insuranceFinanceExpense + reinsuranceHeldResult
  };
};

export const portfolioPerformance = (
  treaties: Treaty[],
  claims: Claim[],
  assumptions: Ifrs17Assumptions,
  groupBy: 'treaty' | 'cedant'
): PortfolioPerformanceRow[] => {
  const groups = new Map<string, { premium: number; revenue: number; claimsIncurred: number; expenses: number }>();

  treaties.forEach(t => {
    const key = groupBy === 'treaty' ? t.treatyName : t.cedant;
    if (!groups.has(key)) groups.set(key, { premium: 0, revenue: 0, claimsIncurred: 0, expenses: 0 });
    const g = groups.get(key)!;
    const earned = earnedFraction(t, assumptions.valuationDate);
    g.premium += t.premium;
    g.revenue += t.premium * earned;
    g.expenses += t.premium * t.commission / 100 * earned;
    const tClaims = claims.filter(c => c.treatyId === t.id);
    g.claimsIncurred += tClaims.reduce((s, c) => s + claimIncurred(c), 0);
  });

  return Array.from(groups.entries())
    .map(([key, g]) => ({
      key,
      premium: g.premium,
      revenue: g.revenue,
      claimsIncurred: g.claimsIncurred,
      expenses: g.expenses,
      result: g.revenue - g.claimsIncurred - g.expenses,
      lossRatio: g.revenue > 0 ? (g.claimsIncurred / g.revenue) * 100 : null
    }))
    .sort((a, b) => b.premium - a.premium);
};

export { earnedFraction };
export type { LrcRollForward, LicRollForward };
