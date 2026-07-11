// Credibility blending (limited-fluctuation): weights the account's own
// experience against the exposure/ELR prior by claim volume.

import { CredibilityBlend, ExperienceYear, MethodResult, PricingAssumptions } from './types';

export const credibilityBlend = (
  experience: ExperienceYear[],
  experienceResult: MethodResult,
  priorResult: MethodResult,
  assumptions: PricingAssumptions
): CredibilityBlend => {
  const claimCount = experience.reduce((s, e) => s + e.claimCount, 0);
  const z = Math.min(1, Math.sqrt(claimCount / Math.max(1, assumptions.fullCredibilityClaims)));

  const experienceLossCost = experienceResult.usable ? experienceResult.lossCost : 0;
  const priorLossCost = priorResult.lossCost;
  const zEffective = experienceResult.usable ? z : 0;
  const blended = zEffective * experienceLossCost + (1 - zEffective) * priorLossCost;

  return {
    z: zEffective,
    claimCount,
    experienceLossCost,
    priorLossCost,
    blendedLossCost: blended,
    note: experienceResult.usable
      ? `Z = √(${claimCount}/${assumptions.fullCredibilityClaims}) = ${(zEffective * 100).toFixed(0)}% on experience, ${(100 - zEffective * 100).toFixed(0)}% on the exposure prior`
      : 'No usable experience — 100% weight on the exposure prior'
  };
};
