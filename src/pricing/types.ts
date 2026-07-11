// Shared types for the deterministic pricing engine (Stage 6A).

export type PricingTreatyType = 'Quota Share' | 'Surplus' | 'XOL' | 'Stop Loss' | 'Catastrophe' | 'Facultative';

/** Structure of the deal being priced. */
export interface PricingStructure {
  treatyType: PricingTreatyType;
  linesOfBusiness: string[];        // from the inward portfolio
  subjectPremium: number;           // estimated/derived subject premium
  currency: string;
  // Proportional
  cessionPct?: number;
  // Non-proportional
  attachment?: number;
  limit?: number;
  // Stop loss (as loss ratios % of subject premium)
  lrAttachPct?: number;
  lrExhaustPct?: number;
  // Facultative
  linkedTreatyId?: string;
  // Cedant recall: restrict experience to one cedant and/or contract number
  cedant?: string;
  contractNumber?: string;
}

export interface PricingAssumptions {
  claimsInflationPct: number;       // trend historical losses to current
  premiumTrendPct: number;          // trend historical premiums
  expectedLossRatioPct: number;     // prior / market ELR
  riskLoadingPct: number;           // volatility loading on the loss cost
  expenseLoadingPct: number;        // internal expenses (% of office premium)
  commissionLoadingPct: number;     // ceding commission (% of office premium)
  profitLoadingPct: number;         // target margin (% of office premium)
  fullCredibilityClaims: number;    // claim count for full credibility
  exposureCurveExponent: number;    // power-curve parameter for exposure rating
}

/** One historical experience year, trended to current levels. */
export interface ExperienceYear {
  year: number;
  premium: number;                  // trended premium
  losses: number;                   // trended gross losses
  lossesInStructure: number;        // losses capped/ceded to the priced structure
  claimCount: number;
  lossRatioPct: number | null;      // in-structure losses / premium
}

export type PricingMethodKey = 'burningCost' | 'experience' | 'exposure' | 'frequencySeverity' | 'expectedLossRatio';

export const PRICING_METHOD_LABELS: Record<PricingMethodKey, string> = {
  burningCost: 'Burning Cost',
  experience: 'Experience Rating',
  exposure: 'Exposure Rating',
  frequencySeverity: 'Frequency–Severity',
  expectedLossRatio: 'Expected Loss Ratio'
};

export interface MethodResult {
  method: PricingMethodKey;
  lossCost: number;                 // expected loss cost to the structure (monetary)
  lossCostRatePct: number | null;   // loss cost / subject premium
  note: string;                     // how it was derived
  usable: boolean;                  // enough data to rely on it
}

export interface CredibilityBlend {
  z: number;                        // credibility factor 0..1
  claimCount: number;
  experienceLossCost: number;
  priorLossCost: number;            // exposure / ELR-based prior
  blendedLossCost: number;
  note: string;
}

/** Technical → office premium waterfall. */
export interface PremiumBuildUp {
  expectedLossCost: number;
  riskLoading: number;
  technicalPremium: number;         // loss cost + risk loading
  expenseLoading: number;
  commissionLoading: number;
  profitLoading: number;
  officePremium: number;
  ratePct: number | null;           // office / subject premium
  rateOnLinePct: number | null;     // office / limit (non-proportional)
  loadingsSumPct: number;           // expense+commission+profit (% of office)
}

export interface PricingScenario {
  id: string;
  name: string;
  lossShockPct: number;             // e.g. +20 → losses ×1.2
  inflationShiftPct: number;        // added to claims inflation
  structureShiftPct: number;        // attachment/retention shift (+ = higher retention)
  officePremium: number;
  deltaVsBasePct: number | null;
}

export interface PricingValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

/** A saved pricing exercise (persisted history). */
export interface PricingRecord {
  id: string;
  date: string;
  treatyType: PricingTreatyType;
  linesOfBusiness: string[];
  subjectPremium: number;
  officePremium: number;
  ratePct: number | null;
  selectedBasis: string;            // e.g. 'Credibility blend'
  outcome: 'Draft' | 'Quoted' | 'Bound' | 'Declined';
}
