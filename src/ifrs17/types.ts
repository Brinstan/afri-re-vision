// IFRS 17 domain types shared across the calculation modules.

export type MeasurementModel = 'PAA' | 'GMM' | 'VFA';

export type RiskAdjustmentMethod = 'percentOfReserves' | 'confidenceLevel' | 'costOfCapital';

export interface Ifrs17Assumptions {
  valuationDate: string;            // ISO date the balances are struck at
  discountRate: number;             // % p.a. used for simplified discounting
  riskAdjustmentMethod: RiskAdjustmentMethod;
  riskAdjustmentPercent: number;    // used by percentOfReserves
  confidenceLevel: 65 | 75 | 85 | 95; // used by confidenceLevel
  costOfCapitalRate: number;        // % p.a. (placeholder method)
  expenseRatio: number;             // % of premium as attributable expenses
  reportingCurrency: string;
  /** Per-treaty measurement model overrides (treatyId -> model). */
  modelOverrides: Record<string, MeasurementModel>;
}

export interface Ifrs17Filters {
  cedant: string;      // 'all' or value
  treatyId: string;
  broker: string;
  country: string;
  lineOfBusiness: string;
  accidentYear: string;
  underwritingYear: string;
}

export const ALL_FILTERS: Ifrs17Filters = {
  cedant: 'all', treatyId: 'all', broker: 'all', country: 'all',
  lineOfBusiness: 'all', accidentYear: 'all', underwritingYear: 'all'
};

/** LRC roll-forward for one treaty / group. */
export interface LrcRollForward {
  treatyId: string;
  treatyName: string;
  model: MeasurementModel;
  openingBalance: number;
  premiumReceived: number;
  revenueRecognized: number;
  acquisitionCashFlows: number;
  lossComponent: number;
  csm: number;                 // GMM only, 0 under PAA
  closingBalance: number;
  earnedFraction: number;
}

/** LIC roll-forward for one treaty / group. */
export interface LicRollForward {
  treatyId: string;
  treatyName: string;
  openingBalance: number;
  claimsIncurred: number;
  claimsPaid: number;
  ibnrMovement: number;
  riskAdjustment: number;
  closingBalance: number;
}

export interface FulfilmentCashFlows {
  expectedClaims: number;
  expectedExpenses: number;
  reinsuranceRecoveries: number;
  discountEffect: number;       // reduction from discounting (negative adjustment)
  riskAdjustment: number;
  totalFcf: number;
}

export interface ReinsuranceIssued {
  premium: number;
  premiumReceived: number;
  claimsIncurred: number;
  claimsPaid: number;
  revenue: number;
  expenses: number;             // commission + attributable expenses
  serviceResult: number;
}

export interface ReinsuranceHeld {
  cededPremium: number;
  recoveries: number;
  netRetroCost: number;         // ceded premium - recoveries
}

export interface FinancialStatements {
  insuranceRevenue: number;
  insuranceServiceExpenses: number;  // incurred claims + expenses + RA change
  insuranceServiceResult: number;
  insuranceFinanceExpense: number;   // unwind of discount on LIC (simplified)
  reinsuranceHeldResult: number;     // recoveries - ceded premium
  technicalResult: number;
}

export interface PortfolioPerformanceRow {
  key: string;                 // treaty or cedant name
  premium: number;
  revenue: number;
  claimsIncurred: number;
  expenses: number;
  result: number;
  lossRatio: number | null;
}
