// Model layer: risk scoring, portfolio fit, appetite assessment, and the
// model registry. All models are transparent weighted heuristics — the
// registry documents exactly what a backend ML model would replace.

import { confidenceFrom } from './features';
import {
  AppetiteAssessment, Explanation, ExplanationFactor, ModelInfo,
  PortfolioFit, PricingFeatures, RiskScore, SensitivityPoint
} from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Generic sensitivity: re-run a scoring function with each named feature shifted. */
export const sensitivityOf = (
  f: PricingFeatures,
  compute: (f: PricingFeatures) => number,
  variables: Array<{ key: keyof PricingFeatures; label: string }>,
  shiftPct = 15
): SensitivityPoint[] => {
  const base = compute(f);
  const points: SensitivityPoint[] = [];
  variables.forEach(({ key, label }) => {
    const current = f[key];
    if (typeof current !== 'number' || current === 0) return;
    const shifted = { ...f, [key]: current * (1 + shiftPct / 100) } as PricingFeatures;
    const result = compute(shifted);
    points.push({
      variable: label,
      shift: `+${shiftPct}%`,
      resultShiftPct: base !== 0 ? ((result - base) / Math.abs(base)) * 100 : 0
    });
  });
  return points.sort((a, b) => Math.abs(b.resultShiftPct) - Math.abs(a.resultShiftPct));
};

// ---------------------------------------------------------------------------
// Risk scoring (0 best – 10 worst): weighted, fully disclosed
// ---------------------------------------------------------------------------

const RISK_WEIGHTS = { lossRatio: 35, volatility: 25, dataDepth: 15, concentration: 15, adequacy: 10 };

const riskScoreValue = (f: PricingFeatures): number => {
  const lrScore = f.lossRatioPct === null ? 5 : clamp((f.lossRatioPct - 40) / 8, 0, 10);       // 40%→0, 120%→10
  const volScore = f.lossRatioVolatility === null ? 5 : clamp(f.lossRatioVolatility * 10, 0, 10);
  const dataScore = clamp(10 - (f.experienceYears * 1.5 + f.claimCount / 10), 0, 10);
  const concScore = clamp((f.cedantConcentrationPct - 20) / 8, 0, 10);                          // >20% starts penalising
  const adqScore = f.rateAdequacyPct === null ? 5 : clamp((110 - f.rateAdequacyPct) / 6, 0, 10);
  return (lrScore * RISK_WEIGHTS.lossRatio + volScore * RISK_WEIGHTS.volatility +
          dataScore * RISK_WEIGHTS.dataDepth + concScore * RISK_WEIGHTS.concentration +
          adqScore * RISK_WEIGHTS.adequacy) / 100;
};

export const riskScore = (f: PricingFeatures): RiskScore => {
  const score = riskScoreValue(f);
  const conf = confidenceFrom(f);
  const factors: ExplanationFactor[] = [
    {
      name: 'Loss ratio', value: f.lossRatioPct === null ? 'no data' : `${f.lossRatioPct.toFixed(1)}%`,
      weightPct: RISK_WEIGHTS.lossRatio,
      direction: (f.lossRatioPct ?? 60) > 70 ? 'increases' : 'decreases',
      detail: 'Trended in-scope loss ratio vs a 40–120% scale'
    },
    {
      name: 'Volatility', value: f.lossRatioVolatility === null ? 'n/a' : `CV ${(f.lossRatioVolatility * 100).toFixed(0)}%`,
      weightPct: RISK_WEIGHTS.volatility,
      direction: (f.lossRatioVolatility ?? 0.5) > 0.4 ? 'increases' : 'decreases',
      detail: 'Year-to-year swing of loss ratios'
    },
    {
      name: 'Data depth', value: `${f.experienceYears} yr / ${f.claimCount} claims`,
      weightPct: RISK_WEIGHTS.dataDepth,
      direction: f.experienceYears < 3 ? 'increases' : 'decreases',
      detail: 'Thin history adds parameter risk'
    },
    {
      name: 'Cedant concentration', value: `${f.cedantConcentrationPct.toFixed(0)}%`,
      weightPct: RISK_WEIGHTS.concentration,
      direction: f.cedantConcentrationPct > 40 ? 'increases' : 'neutral',
      detail: 'Largest cedant share of the scope premium'
    },
    {
      name: 'Rate adequacy', value: f.rateAdequacyPct === null ? 'n/a' : `${f.rateAdequacyPct.toFixed(0)}%`,
      weightPct: RISK_WEIGHTS.adequacy,
      direction: (f.rateAdequacyPct ?? 100) < 95 ? 'increases' : 'decreases',
      detail: 'Booked vs required premium on these lines'
    }
  ];
  const explanation: Explanation = {
    factors,
    confidencePct: conf.pct,
    confidenceBasis: conf.basis,
    sensitivity: sensitivityOf(f, riskScoreValue, [
      { key: 'lossRatioPct', label: 'Loss ratio' },
      { key: 'lossRatioVolatility', label: 'Volatility' },
      { key: 'cedantConcentrationPct', label: 'Cedant concentration' }
    ])
  };
  return {
    score,
    band: score < 3 ? 'Low' : score < 5.5 ? 'Medium' : score < 7.5 ? 'High' : 'Very High',
    explanation
  };
};

// ---------------------------------------------------------------------------
// Portfolio fit (0–100 higher = better)
// ---------------------------------------------------------------------------

const fitValue = (f: PricingFeatures): number => {
  let score = 50;
  if (f.rateAdequacyPct !== null) score += clamp((f.rateAdequacyPct - 100) * 0.8, -25, 25);
  if (f.lossRatioPct !== null) score += clamp((65 - f.lossRatioPct) * 0.5, -20, 20);
  score -= clamp((f.cedantConcentrationPct - 30) * 0.5, 0, 20);
  score += clamp(f.credibilityZ * 15, 0, 15);
  return clamp(score, 0, 100);
};

export const portfolioFit = (f: PricingFeatures): PortfolioFit => {
  const score = fitValue(f);
  const conf = confidenceFrom(f);
  return {
    score,
    verdict: score >= 70 ? 'Strong fit' : score >= 55 ? 'Acceptable' : score >= 40 ? 'Marginal' : 'Poor fit',
    explanation: {
      factors: [
        { name: 'Rate adequacy on these lines', value: f.rateAdequacyPct === null ? 'n/a' : `${f.rateAdequacyPct.toFixed(0)}%`, weightPct: 35, direction: (f.rateAdequacyPct ?? 100) >= 100 ? 'increases' : 'decreases', detail: 'Adequately priced lines strengthen the book' },
        { name: 'Expected profitability', value: f.lossRatioPct === null ? 'n/a' : `LR ${f.lossRatioPct.toFixed(1)}%`, weightPct: 30, direction: (f.lossRatioPct ?? 65) <= 65 ? 'increases' : 'decreases', detail: 'Against a 65% target loss ratio' },
        { name: 'Diversification', value: `${f.cedantConcentrationPct.toFixed(0)}% concentration`, weightPct: 20, direction: f.cedantConcentrationPct > 30 ? 'decreases' : 'increases', detail: 'Concentrated cedant exposure weakens fit' },
        { name: 'Evidence quality', value: `Z = ${(f.credibilityZ * 100).toFixed(0)}%`, weightPct: 15, direction: f.credibilityZ > 0.5 ? 'increases' : 'neutral', detail: 'Credible experience supports the assessment' }
      ],
      confidencePct: conf.pct,
      confidenceBasis: conf.basis,
      sensitivity: sensitivityOf(f, fitValue, [
        { key: 'rateAdequacyPct', label: 'Rate adequacy' },
        { key: 'lossRatioPct', label: 'Loss ratio' },
        { key: 'cedantConcentrationPct', label: 'Concentration' }
      ])
    }
  };
};

// ---------------------------------------------------------------------------
// Risk appetite assessment (transparent rules)
// ---------------------------------------------------------------------------

export const appetiteAssessment = (f: PricingFeatures): AppetiteAssessment => {
  const checks = [
    { rule: 'Expected loss ratio within appetite', actual: f.lossRatioPct === null ? 'no data' : `${f.lossRatioPct.toFixed(1)}%`, limit: '≤ 80%', pass: (f.lossRatioPct ?? 0) <= 80 },
    { rule: 'Single-cedant concentration', actual: `${f.cedantConcentrationPct.toFixed(0)}%`, limit: '≤ 60%', pass: f.cedantConcentrationPct <= 60 },
    { rule: 'Deal size vs subject premium', actual: f.subjectPremium > 0 ? `${((f.officePremium / f.subjectPremium) * 100).toFixed(1)}% rate` : 'n/a', limit: '≤ 100%', pass: f.subjectPremium <= 0 || f.officePremium <= f.subjectPremium },
    { rule: 'Minimum evidence', actual: `${f.experienceYears} yr / ${f.claimCount} claims`, limit: '≥ 1 yr or exposure prior', pass: f.experienceYears >= 1 || f.expectedLossCost > 0 }
  ];
  return { withinAppetite: checks.every(c => c.pass), checks };
};

// ---------------------------------------------------------------------------
// Model registry — backend-ML extension points
// ---------------------------------------------------------------------------

export const MODEL_REGISTRY: ModelInfo[] = [
  { id: 'risk-score-v1', name: 'Risk Scoring Model', version: '1.0', type: 'Deterministic heuristic', features: ['lossRatioPct', 'lossRatioVolatility', 'experienceYears', 'claimCount', 'cedantConcentrationPct', 'rateAdequacyPct'], status: 'Active', backendReady: 'Gradient-boosted classifier on bound/loss-making outcomes' },
  { id: 'portfolio-fit-v1', name: 'Portfolio Fit Model', version: '1.0', type: 'Deterministic heuristic', features: ['rateAdequacyPct', 'lossRatioPct', 'cedantConcentrationPct', 'credibilityZ'], status: 'Active', backendReady: 'Portfolio marginal-contribution model (Euler allocation)' },
  { id: 'premium-adjust-v1', name: 'Premium Adjustment Model', version: '1.0', type: 'Deterministic heuristic', features: ['riskScore', 'officePremium'], status: 'Active', backendReady: 'GLM/GBM frequency-severity rater trained on market outcomes' },
  { id: 'renewal-v1', name: 'Renewal Recommendation Model', version: '1.0', type: 'Deterministic heuristic', features: ['treaty lossRatio', 'premium size', 'claims count'], status: 'Active', backendReady: 'Churn/profitability model on renewal history' }
];
