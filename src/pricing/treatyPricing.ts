// Treaty pricing orchestrator: runs every applicable method for the structure,
// credibility-blends experience against the exposure prior, and builds the
// office premium. One entry point for all six arrangement types.

import type { Claim, ExternalExperienceRow, Treaty } from '@/components/DataStore';
import { buildExperience, burningCost, experienceRating } from './burningCost';
import { exposureRating } from './exposureRating';
import { frequencySeverity } from './frequencySeverity';
import { credibilityBlend } from './credibility';
import { buildUpPremium } from './premiumBuildUp';
import {
  CredibilityBlend, ExperienceYear, MethodResult, PremiumBuildUp,
  PricingAssumptions, PricingStructure
} from './types';

export interface PricingOutput {
  experience: ExperienceYear[];
  methods: MethodResult[];
  blend: CredibilityBlend;
  buildUp: PremiumBuildUp;
  selectedBasis: string;
}

export const priceStructure = (
  claims: Claim[],
  treaties: Treaty[],
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  externalRows: ExternalExperienceRow[] = []
): PricingOutput => {
  const experience = buildExperience(claims, treaties, structure, assumptions, externalRows);

  const bc = burningCost(experience, structure);
  const exp = experienceRating(experience, structure);
  const expo = exposureRating(claims, treaties, structure, assumptions, externalRows);
  const fs = frequencySeverity(claims, treaties, structure, assumptions, externalRows);

  const elrLossCost = structure.subjectPremium * assumptions.expectedLossRatioPct / 100 *
    (structure.treatyType === 'Quota Share' || structure.treatyType === 'Surplus'
      ? (structure.cessionPct ?? 100) / 100
      : 1);
  const elr: MethodResult = {
    method: 'expectedLossRatio',
    lossCost: structure.treatyType === 'XOL' || structure.treatyType === 'Catastrophe' || structure.treatyType === 'Facultative' || structure.treatyType === 'Stop Loss'
      ? expo.lossCost // for structured covers the ELR method equals the exposure allocation
      : elrLossCost,
    lossCostRatePct: structure.subjectPremium > 0 ? null : null,
    note: `Subject premium × ELR ${assumptions.expectedLossRatioPct}%${structure.cessionPct ? ` × cession ${structure.cessionPct}%` : ''}`,
    usable: true
  };
  elr.lossCostRatePct = structure.subjectPremium > 0 ? (elr.lossCost / structure.subjectPremium) * 100 : null;

  // Experience side: prefer experience rating, fall back to burning cost
  const experienceSide = exp.usable ? exp : bc;
  // Prior side: exposure rating (falls back to ELR by construction)
  const prior = expo.usable ? expo : elr;

  const blend = credibilityBlend(experience, experienceSide, prior, assumptions);
  const buildUp = buildUpPremium(blend.blendedLossCost, structure, assumptions);

  return {
    experience,
    methods: [bc, exp, expo, fs, elr],
    blend,
    buildUp,
    selectedBasis: `Credibility blend (${(blend.z * 100).toFixed(0)}% experience / ${(100 - blend.z * 100).toFixed(0)}% exposure prior)`
  };
};
