// Recommendation engine: explainable suggestions that AUGMENT the Stage 6A
// deterministic pricing (always anchored to the office premium baseline).

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { PricingOutput } from '../treatyPricing';
import { PricingAssumptions, PricingStructure } from '../types';
import { confidenceFrom } from './features';
import { riskScore, sensitivityOf } from './models';
import { Explanation, PricingFeatures, Recommendation, RenewalRecommendation } from './types';

const fmt = (n: number) => Math.round(n).toLocaleString();
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const explain = (
  f: PricingFeatures,
  factors: Explanation['factors'],
  compute: (f: PricingFeatures) => number,
  sensVars: Array<{ key: keyof PricingFeatures; label: string }>
): Explanation => {
  const conf = confidenceFrom(f);
  return { factors, confidencePct: conf.pct, confidenceBasis: conf.basis, sensitivity: sensitivityOf(f, compute, sensVars) };
};

export const buildRecommendations = (
  structure: PricingStructure,
  output: PricingOutput,
  f: PricingFeatures,
  assumptions: PricingAssumptions
): Recommendation[] => {
  const risk = riskScore(f);
  const recs: Recommendation[] = [];
  const cur = structure.currency;

  // ---- Suggested premium: 6A office premium × risk-score adjustment (±15%)
  const premiumAdj = (feat: PricingFeatures) => feat.officePremium * (1 + (riskScore(feat).score - 5) * 0.03);
  const suggestedPremium = premiumAdj(f);
  recs.push({
    key: 'premium',
    label: 'Suggested Premium',
    value: `${cur} ${fmt(suggestedPremium)}`,
    numericValue: suggestedPremium,
    rationale: `Deterministic office premium ${fmt(f.officePremium)} adjusted ${suggestedPremium >= f.officePremium ? 'up' : 'down'} ${Math.abs(((suggestedPremium / Math.max(1, f.officePremium)) - 1) * 100).toFixed(1)}% for the ${risk.band.toLowerCase()} risk score (${risk.score.toFixed(1)}/10).`,
    explanation: explain(f, [
      { name: '6A office premium (anchor)', value: `${cur} ${fmt(f.officePremium)}`, weightPct: 70, direction: 'neutral', detail: 'The deterministic actuarial baseline is never replaced' },
      { name: 'Risk score', value: `${risk.score.toFixed(1)}/10 (${risk.band})`, weightPct: 30, direction: risk.score > 5 ? 'increases' : 'decreases', detail: '±3% per point away from the neutral score of 5' }
    ], premiumAdj, [
      { key: 'officePremium', label: 'Office premium' },
      { key: 'lossRatioPct', label: 'Loss ratio' },
      { key: 'lossRatioVolatility', label: 'Volatility' }
    ])
  });

  // ---- Suggested retention/deductible: severity-anchored
  const retentionCalc = (feat: PricingFeatures) =>
    Math.max(feat.averageSeverity * 1.5, feat.subjectPremium * 0.05);
  const suggestedRetention = retentionCalc(f);
  recs.push({
    key: 'retention',
    label: 'Suggested Retention / Deductible',
    value: `${cur} ${fmt(suggestedRetention)}`,
    numericValue: suggestedRetention,
    rationale: 'Set above routine losses (1.5× average severity, floored at 5% of subject premium) so the cover responds to genuine severity, not attrition.',
    explanation: explain(f, [
      { name: 'Average severity', value: `${cur} ${fmt(f.averageSeverity)}`, weightPct: 60, direction: 'increases', detail: 'Retention scales at 1.5× the trended average claim' },
      { name: 'Subject premium floor', value: `${cur} ${fmt(f.subjectPremium * 0.05)}`, weightPct: 40, direction: 'neutral', detail: '5% of subject premium prevents trivial retentions on thin claim data' }
    ], retentionCalc, [
      { key: 'averageSeverity', label: 'Average severity' },
      { key: 'subjectPremium', label: 'Subject premium' }
    ])
  });

  // ---- Suggested capacity: appetite-constrained
  const capacityCalc = (feat: PricingFeatures) => {
    const base = Math.max(feat.largestLoss * 1.25, feat.averageSeverity * 4);
    const riskFactor = clamp(1.4 - riskScore(feat).score * 0.08, 0.6, 1.4);
    return base * riskFactor;
  };
  const suggestedCapacity = capacityCalc(f);
  recs.push({
    key: 'capacity',
    label: 'Suggested Capacity',
    value: `${cur} ${fmt(suggestedCapacity)}`,
    numericValue: suggestedCapacity,
    rationale: 'Sized to absorb 125% of the largest observed loss, then scaled by the risk score so worse risks get less capacity.',
    explanation: explain(f, [
      { name: 'Largest observed loss', value: `${cur} ${fmt(f.largestLoss)}`, weightPct: 55, direction: 'increases', detail: 'Capacity must exceed the worst historical experience' },
      { name: 'Average severity', value: `${cur} ${fmt(f.averageSeverity)}`, weightPct: 20, direction: 'increases', detail: '4× severity fallback for thin data' },
      { name: 'Risk score scaling', value: `${risk.score.toFixed(1)}/10`, weightPct: 25, direction: risk.score > 5 ? 'decreases' : 'increases', detail: 'High risk shrinks offered capacity' }
    ], capacityCalc, [
      { key: 'largestLoss', label: 'Largest loss' },
      { key: 'averageSeverity', label: 'Average severity' }
    ])
  });

  // ---- Suggested layer structure (non-proportional only)
  if (['XOL', 'Catastrophe', 'Facultative'].includes(structure.treatyType)) {
    const l1Width = suggestedCapacity * 0.4;
    const l2Width = suggestedCapacity * 0.6;
    recs.push({
      key: 'layers',
      label: 'Suggested Layer Structure',
      value: `L1: ${fmt(l1Width)} xs ${fmt(suggestedRetention)} · L2: ${fmt(l2Width)} xs ${fmt(suggestedRetention + l1Width)}`,
      numericValue: suggestedCapacity,
      rationale: 'Two layers: a working layer (40% of capacity) above the retention for frequency losses, and a higher layer (60%) for severity — cheaper to place than one thick layer.',
      explanation: explain(f, [
        { name: 'Suggested retention', value: `${cur} ${fmt(suggestedRetention)}`, weightPct: 35, direction: 'neutral', detail: 'Attachment of the working layer' },
        { name: 'Suggested capacity', value: `${cur} ${fmt(suggestedCapacity)}`, weightPct: 40, direction: 'increases', detail: 'Total limit split 40/60 across the layers' },
        { name: 'Claim frequency', value: `${f.claimFrequencyPerYear.toFixed(1)}/yr`, weightPct: 25, direction: f.claimFrequencyPerYear > 3 ? 'increases' : 'neutral', detail: 'Higher frequency favours a wider working layer' }
      ], capacityCalc, [{ key: 'largestLoss', label: 'Largest loss' }])
    });
  }

  // ---- Suggested commission (proportional only)
  if (structure.treatyType === 'Quota Share' || structure.treatyType === 'Surplus') {
    const commissionCalc = (feat: PricingFeatures) =>
      clamp(30 - Math.max(0, ((feat.lossRatioPct ?? 65) - 55)) * 0.35, 10, 32.5);
    const suggestedCommission = commissionCalc(f);
    recs.push({
      key: 'commission',
      label: 'Suggested Ceding Commission',
      value: `${suggestedCommission.toFixed(1)}%`,
      numericValue: suggestedCommission,
      rationale: `Starts at 30% for clean business and gives back 0.35 points per loss-ratio point above 55% — this account's LR of ${f.lossRatioPct?.toFixed(1) ?? 'n/a'}% lands it at ${suggestedCommission.toFixed(1)}%.`,
      explanation: explain(f, [
        { name: 'Loss ratio', value: f.lossRatioPct === null ? 'n/a' : `${f.lossRatioPct.toFixed(1)}%`, weightPct: 70, direction: (f.lossRatioPct ?? 65) > 55 ? 'decreases' : 'increases', detail: 'Worse experience earns less commission' },
        { name: 'Market band', value: '10–32.5%', weightPct: 30, direction: 'neutral', detail: 'Clamped to the customary East African band' }
      ], commissionCalc, [{ key: 'lossRatioPct', label: 'Loss ratio' }])
    });
  }

  // ---- Suggested profit margin
  const marginCalc = (feat: PricingFeatures) =>
    clamp(assumptions.profitLoadingPct + (riskScore(feat).score - 5) * 1.2 + (feat.lossRatioVolatility ?? 0.3) * 5, 5, 25);
  const suggestedMargin = marginCalc(f);
  recs.push({
    key: 'margin',
    label: 'Suggested Profit Margin',
    value: `${suggestedMargin.toFixed(1)}%`,
    numericValue: suggestedMargin,
    rationale: `Base ${assumptions.profitLoadingPct}% loading adjusted for the risk score and loss-ratio volatility — riskier, swingier business must earn more.`,
    explanation: explain(f, [
      { name: 'Base profit loading', value: `${assumptions.profitLoadingPct}%`, weightPct: 50, direction: 'neutral', detail: 'Your 6A assumption is the anchor' },
      { name: 'Risk score', value: `${risk.score.toFixed(1)}/10`, weightPct: 30, direction: risk.score > 5 ? 'increases' : 'decreases', detail: '±1.2 points per risk-score point' },
      { name: 'Volatility', value: f.lossRatioVolatility === null ? 'n/a' : `CV ${(f.lossRatioVolatility * 100).toFixed(0)}%`, weightPct: 20, direction: 'increases', detail: 'Volatile results need a capital cushion' }
    ], marginCalc, [
      { key: 'lossRatioVolatility', label: 'Volatility' },
      { key: 'lossRatioPct', label: 'Loss ratio' }
    ])
  });

  // ---- Suggested treaty structure
  const vol = f.lossRatioVolatility ?? 0.4;
  const structureSuggestion =
    f.claimFrequencyPerYear > 5 && vol < 0.35 ? 'Quota Share' :
    vol > 0.5 || f.largestLoss > f.subjectPremium * 0.3 ? 'XOL' :
    f.claimFrequencyPerYear < 1 ? 'Facultative' : 'Surplus';
  recs.push({
    key: 'structure',
    label: 'Suggested Treaty Structure',
    value: structureSuggestion,
    numericValue: 0,
    rationale: structureSuggestion === 'Quota Share'
      ? 'High-frequency, stable business shares proportionally best.'
      : structureSuggestion === 'XOL'
        ? 'Volatile / severity-driven experience is best capped with excess of loss.'
        : structureSuggestion === 'Facultative'
          ? 'Too few losses for treaty pricing — underwrite risk by risk.'
          : 'Moderate frequency with size variation suits a surplus arrangement.',
    explanation: explain(f, [
      { name: 'Claim frequency', value: `${f.claimFrequencyPerYear.toFixed(1)}/yr`, weightPct: 40, direction: 'neutral', detail: '>5/yr favours proportional; <1/yr favours facultative' },
      { name: 'Volatility', value: `CV ${(vol * 100).toFixed(0)}%`, weightPct: 35, direction: 'neutral', detail: '>50% favours XOL protection' },
      { name: 'Largest loss vs premium', value: f.subjectPremium > 0 ? `${((f.largestLoss / f.subjectPremium) * 100).toFixed(0)}%` : 'n/a', weightPct: 25, direction: 'neutral', detail: 'Severity spikes above 30% of premium favour XOL' }
    ], (feat) => feat.claimFrequencyPerYear, [{ key: 'claimFrequencyPerYear', label: 'Frequency' }])
  });

  return recs;
};

// ---------------------------------------------------------------------------
// Renewal recommendations across the in-force book
// ---------------------------------------------------------------------------

export const renewalRecommendations = (treaties: Treaty[], claims: Claim[]): RenewalRecommendation[] =>
  treaties.map(t => {
    const tClaims = claims.filter(c => c.treatyId === t.id);
    const incurred = tClaims.reduce((s, c) => s + claimIncurred(c), 0);
    const lr = t.premium > 0 ? (incurred / t.premium) * 100 : null;
    const confidence = Math.min(90, 40 + tClaims.length * 8);

    let action: RenewalRecommendation['action'];
    let rateChange = 0;
    let rationale: string;
    if (lr === null || lr === 0) {
      action = 'Renew as-is';
      rationale = 'No claims experience against this treaty — retain at expiring terms while monitoring.';
    } else if (lr <= 60) {
      action = 'Renew as-is';
      rationale = `Profitable at a ${lr.toFixed(0)}% loss ratio — protect the relationship at expiring terms.`;
    } else if (lr <= 90) {
      action = 'Renew with rate increase';
      rateChange = Math.round((lr - 60) / 3);
      rationale = `Loss ratio of ${lr.toFixed(0)}% erodes margin — a ${rateChange}% rate increase restores the target 60%.`;
    } else if (lr <= 130) {
      action = 'Restructure';
      rateChange = Math.round((lr - 60) / 2.5);
      rationale = `Loss-making at ${lr.toFixed(0)}% — reprice ~${rateChange}% and tighten terms (event limit / higher retention).`;
    } else {
      action = 'Decline';
      rationale = `Loss ratio of ${lr.toFixed(0)}% is unrecoverable through pricing — decline unless fundamentally restructured.`;
    }
    return {
      treatyId: t.id,
      treatyName: t.treatyName,
      cedant: t.cedant,
      action,
      suggestedRateChangePct: rateChange,
      rationale,
      lossRatioPct: lr,
      confidencePct: confidence
    };
  });
