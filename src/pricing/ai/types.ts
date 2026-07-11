// Stage 6B: explainable AI types. Every recommendation carries a full
// explanation — contributing factors with weights and direction, a confidence
// score, and sensitivity analysis. No opaque outputs.

export interface ExplanationFactor {
  name: string;
  value: string;                 // human-readable current value, e.g. "68.5%"
  weightPct: number;             // relative importance (sums ≈ 100 across factors)
  direction: 'increases' | 'decreases' | 'neutral';
  detail: string;                // why this factor pushes the result
}

export interface SensitivityPoint {
  variable: string;
  shift: string;                 // e.g. "+15%"
  resultShiftPct: number;        // % change in the recommended value
}

export interface Explanation {
  factors: ExplanationFactor[];
  confidencePct: number;         // 0–100, from data depth and volatility
  confidenceBasis: string;
  sensitivity: SensitivityPoint[];
}

export interface Recommendation {
  key: string;                   // 'premium' | 'deductible' | 'retention' | ...
  label: string;
  value: string;                 // formatted recommendation
  numericValue: number;
  rationale: string;             // one-sentence why
  explanation: Explanation;
}

/** Engineered features derived from live data for a pricing scope. */
export interface PricingFeatures {
  lossRatioPct: number | null;          // trended in-scope LR
  lossRatioVolatility: number | null;   // CV of yearly loss ratios
  claimFrequencyPerYear: number;
  averageSeverity: number;
  largestLoss: number;
  experienceYears: number;
  claimCount: number;
  credibilityZ: number;
  rateAdequacyPct: number | null;       // booked vs required for the scope's LOBs
  cedantConcentrationPct: number;       // largest cedant share of scope premium
  subjectPremium: number;
  officePremium: number;                // the 6A deterministic result (baseline)
  technicalPremium: number;
  expectedLossCost: number;
}

export interface RiskScore {
  score: number;                 // 0 (best) – 10 (worst)
  band: 'Low' | 'Medium' | 'High' | 'Very High';
  explanation: Explanation;
}

export interface PortfolioFit {
  score: number;                 // 0–100 (higher = better fit)
  verdict: 'Strong fit' | 'Acceptable' | 'Marginal' | 'Poor fit';
  explanation: Explanation;
}

export interface AppetiteAssessment {
  withinAppetite: boolean;
  checks: Array<{ rule: string; actual: string; limit: string; pass: boolean }>;
}

export interface RenewalRecommendation {
  treatyId: string;
  treatyName: string;
  cedant: string;
  action: 'Renew as-is' | 'Renew with rate increase' | 'Restructure' | 'Decline';
  suggestedRateChangePct: number;
  rationale: string;
  lossRatioPct: number | null;
  confidencePct: number;
}

export interface MixSuggestion {
  lineOfBusiness: string;
  currentSharePct: number;
  suggestedSharePct: number;
  direction: 'Grow' | 'Hold' | 'Shrink';
  rationale: string;
}

/** Registered heuristic model — the seam for future backend ML. */
export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: 'Deterministic heuristic';
  features: string[];
  status: 'Active';
  backendReady: string;          // what a backend ML model would replace
}
