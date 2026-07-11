// Feature engineering: turns live experience + 6A pricing output into the
// feature vector every AI model consumes. Pure and documented — this is the
// architecture seam where a backend feature store would plug in.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { PricingOutput } from '../treatyPricing';
import { RateAdequacyRow } from '../analytics';
import { PricingStructure } from '../types';
import { PricingFeatures } from './types';

export const buildFeatures = (
  structure: PricingStructure,
  output: PricingOutput,
  treaties: Treaty[],
  claims: Claim[],
  adequacy: RateAdequacyRow[]
): PricingFeatures => {
  const exp = output.experience;
  const withPremium = exp.filter(e => e.premium > 0);

  // Loss ratio and its volatility (coefficient of variation across years)
  const ratios = withPremium.map(e => (e.lossRatioPct ?? 0));
  const meanLr = ratios.length > 0 ? ratios.reduce((s, r) => s + r, 0) / ratios.length : null;
  let volatility: number | null = null;
  if (ratios.length >= 2 && meanLr && meanLr > 0) {
    const variance = ratios.reduce((s, r) => s + Math.pow(r - meanLr, 2), 0) / (ratios.length - 1);
    volatility = Math.sqrt(variance) / meanLr;
  }

  const claimCount = exp.reduce((s, e) => s + e.claimCount, 0);
  const years = Math.max(1, withPremium.length);
  const totalLosses = exp.reduce((s, e) => s + e.losses, 0);
  const largestLoss = Math.max(0, ...exp.map(e => e.claimCount > 0 ? e.losses / e.claimCount : 0));

  // Cedant concentration in the scope
  const scopeTreaties = treaties.filter(t =>
    structure.linkedTreatyId ? t.id === structure.linkedTreatyId :
    (structure.linesOfBusiness.length === 0 || t.lineOfBusiness.some(l => structure.linesOfBusiness.includes(l))) &&
    (!structure.cedant || t.cedant === structure.cedant)
  );
  const byCedant = new Map<string, number>();
  scopeTreaties.forEach(t => byCedant.set(t.cedant, (byCedant.get(t.cedant) ?? 0) + t.premium));
  const scopePremium = scopeTreaties.reduce((s, t) => s + t.premium, 0);
  const cedantConcentration = scopePremium > 0
    ? (Math.max(0, ...byCedant.values()) / scopePremium) * 100
    : 0;

  // Rate adequacy of the scope's lines (premium-weighted)
  const scopeAdequacy = adequacy.filter(a => structure.linesOfBusiness.includes(a.lineOfBusiness));
  const adequacyWeight = scopeAdequacy.reduce((s, a) => s + a.bookedPremium, 0);
  const rateAdequacy = adequacyWeight > 0
    ? scopeAdequacy.reduce((s, a) => s + (a.adequacyPct ?? 100) * a.bookedPremium, 0) / adequacyWeight
    : null;

  return {
    lossRatioPct: meanLr,
    lossRatioVolatility: volatility,
    claimFrequencyPerYear: claimCount / years,
    averageSeverity: claimCount > 0 ? totalLosses / claimCount : 0,
    largestLoss,
    experienceYears: withPremium.length,
    claimCount,
    credibilityZ: output.blend.z,
    rateAdequacyPct: rateAdequacy,
    cedantConcentrationPct: cedantConcentration,
    subjectPremium: structure.subjectPremium,
    officePremium: output.buildUp.officePremium,
    technicalPremium: output.buildUp.technicalPremium,
    expectedLossCost: output.buildUp.expectedLossCost
  };
};

/** Confidence from data depth and stability — shared by all models. */
export const confidenceFrom = (f: PricingFeatures): { pct: number; basis: string } => {
  let pct = 30;
  const reasons: string[] = [];
  if (f.experienceYears >= 5) { pct += 25; reasons.push(`${f.experienceYears} experience years`); }
  else if (f.experienceYears >= 3) { pct += 15; reasons.push(`${f.experienceYears} experience years`); }
  else reasons.push(`only ${f.experienceYears} experience year(s)`);
  if (f.claimCount >= 30) { pct += 25; reasons.push(`${f.claimCount} claims`); }
  else if (f.claimCount >= 10) { pct += 15; reasons.push(`${f.claimCount} claims`); }
  else reasons.push(`only ${f.claimCount} claim(s)`);
  if (f.lossRatioVolatility !== null && f.lossRatioVolatility < 0.3) { pct += 15; reasons.push('stable loss ratios'); }
  else if (f.lossRatioVolatility !== null && f.lossRatioVolatility > 0.6) { pct -= 10; reasons.push('volatile loss ratios'); }
  return { pct: Math.max(10, Math.min(95, pct)), basis: reasons.join(', ') };
};
