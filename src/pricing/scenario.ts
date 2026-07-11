// Scenario modelling: stress the pricing basis and compare office premiums.

import type { Claim, ExternalExperienceRow, Treaty } from '@/components/DataStore';
import { priceStructure } from './treatyPricing';
import { PricingAssumptions, PricingScenario, PricingStructure } from './types';

export interface ScenarioSpec {
  name: string;
  lossShockPct: number;        // scales the blended loss cost
  inflationShiftPct: number;   // added to claims inflation before re-pricing
  structureShiftPct: number;   // shifts attachment/retention (+ = higher retention)
}

export const STANDARD_SCENARIOS: ScenarioSpec[] = [
  { name: 'Base', lossShockPct: 0, inflationShiftPct: 0, structureShiftPct: 0 },
  { name: 'Adverse losses +25%', lossShockPct: 25, inflationShiftPct: 0, structureShiftPct: 0 },
  { name: 'High inflation +5%', lossShockPct: 0, inflationShiftPct: 5, structureShiftPct: 0 },
  { name: 'Higher retention +20%', lossShockPct: 0, inflationShiftPct: 0, structureShiftPct: 20 },
  { name: 'Severe (losses +40%, inflation +5%)', lossShockPct: 40, inflationShiftPct: 5, structureShiftPct: 0 }
];

export const runScenarios = (
  claims: Claim[],
  treaties: Treaty[],
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  externalRows: ExternalExperienceRow[] = [],
  specs: ScenarioSpec[] = STANDARD_SCENARIOS
): PricingScenario[] => {
  const base = priceStructure(claims, treaties, structure, assumptions, externalRows).buildUp.officePremium;

  return specs.map((spec, i) => {
    const shockedAssumptions: PricingAssumptions = {
      ...assumptions,
      claimsInflationPct: assumptions.claimsInflationPct + spec.inflationShiftPct
    };
    const shockedStructure: PricingStructure = {
      ...structure,
      attachment: structure.attachment !== undefined
        ? structure.attachment * (1 + spec.structureShiftPct / 100)
        : undefined,
      lrAttachPct: structure.lrAttachPct !== undefined
        ? structure.lrAttachPct * (1 + spec.structureShiftPct / 100)
        : undefined
    };
    const repriced = priceStructure(claims, treaties, shockedStructure, shockedAssumptions, externalRows);
    const officePremium = repriced.buildUp.officePremium * (1 + spec.lossShockPct / 100);
    return {
      id: `sc-${i}`,
      name: spec.name,
      lossShockPct: spec.lossShockPct,
      inflationShiftPct: spec.inflationShiftPct,
      structureShiftPct: spec.structureShiftPct,
      officePremium,
      deltaVsBasePct: base > 0 ? ((officePremium - base) / base) * 100 : null
    };
  });
};
