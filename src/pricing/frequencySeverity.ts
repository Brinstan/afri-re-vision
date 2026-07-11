// Frequency–severity pricing: expected claim count × expected severity in the
// priced structure, from trended historical claims.

import type { Claim, ExternalExperienceRow, Treaty } from '@/components/DataStore';
import { claimIncurred, inflate } from '@/lib/actuarial';
import { lossToStructure } from './burningCost';
import { explodeLosses, scopeExternalRows } from './externalData';
import { MethodResult, PricingAssumptions, PricingStructure } from './types';

export const frequencySeverity = (
  claims: Claim[],
  treaties: Treaty[],
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  externalRows: ExternalExperienceRow[] = []
): MethodResult => {
  if (structure.treatyType === 'Stop Loss') {
    return { method: 'frequencySeverity', lossCost: 0, lossCostRatePct: null, note: 'Not applicable to aggregate covers — use burning cost / exposure', usable: false };
  }

  const scopeTreatyIds = new Set(
    treaties.filter(t => structure.linkedTreatyId
      ? t.id === structure.linkedTreatyId
      : structure.linesOfBusiness.length === 0 || t.lineOfBusiness.some(l => structure.linesOfBusiness.includes(l))
    ).map(t => t.id));

  const scoped = claims
    .filter(c => scopeTreatyIds.has(c.treatyId))
    .map(c => ({
      year: new Date(c.dateOfLoss).getFullYear(),
      trended: inflate(claimIncurred(c), new Date(c.dateOfLoss).getFullYear(), assumptions.claimsInflationPct)
    }))
    .filter(x => !isNaN(x.year) && x.trended > 0);

  // Imported experience contributes average-severity synthetic losses
  scopeExternalRows(externalRows, structure).forEach(row => {
    explodeLosses(row).forEach(loss => {
      scoped.push({ year: row.year, trended: inflate(loss, row.year, assumptions.claimsInflationPct) });
    });
  });

  if (scoped.length === 0) {
    return { method: 'frequencySeverity', lossCost: 0, lossCostRatePct: null, note: 'No claims in scope', usable: false };
  }

  const years = new Set(scoped.map(x => x.year)).size;
  const frequency = scoped.length / Math.max(1, years);          // claims per year

  // Severity in the structure: only claims that actually reach it
  const inStructure = scoped.map(x => lossToStructure(x.trended, structure)).filter(v => v > 0);
  const hitProbability = inStructure.length / scoped.length;
  const severity = inStructure.length > 0
    ? inStructure.reduce((s, v) => s + v, 0) / inStructure.length
    : 0;

  const lossCost = frequency * hitProbability * severity;
  return {
    method: 'frequencySeverity',
    lossCost,
    lossCostRatePct: structure.subjectPremium > 0 ? (lossCost / structure.subjectPremium) * 100 : null,
    note: `${frequency.toFixed(2)} claims/yr × hit prob ${(hitProbability * 100).toFixed(0)}% × severity ${Math.round(severity).toLocaleString()} (${scoped.length} claims, ${years} yr)`,
    usable: inStructure.length > 0
  };
};
