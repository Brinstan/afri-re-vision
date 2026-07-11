// Experience data preparation, burning cost, and experience rating.
//
// Historical claims and premiums come straight from the DataStore, trended to
// current levels with the pricing assumptions, and each loss is mapped into
// the structure being priced (ceded share, layer tranche, or aggregate).

import type { Claim, ExternalExperienceRow, Treaty } from '@/components/DataStore';
import { claimIncurred, inflate } from '@/lib/actuarial';
import { explodeLosses, scopeExternalRows } from './externalData';
import { ExperienceYear, MethodResult, PricingAssumptions, PricingStructure } from './types';

/** How much of a single gross loss falls into the priced structure. */
export const lossToStructure = (grossLoss: number, s: PricingStructure): number => {
  switch (s.treatyType) {
    case 'Quota Share':
    case 'Surplus':
      return grossLoss * (s.cessionPct ?? 0) / 100;
    case 'XOL':
    case 'Catastrophe':
    case 'Facultative': {
      const att = s.attachment ?? 0;
      const lim = s.limit ?? Infinity;
      return Math.min(Math.max(0, grossLoss - att), lim);
    }
    case 'Stop Loss':
      // Aggregate structure — handled at year level, per-loss returns gross
      return grossLoss;
  }
};

/** Year-level structure mapping for aggregate covers (stop loss). */
const yearLossesToStructure = (yearGross: number, yearPremium: number, s: PricingStructure): number => {
  if (s.treatyType !== 'Stop Loss') return yearGross;
  const att = yearPremium * (s.lrAttachPct ?? 0) / 100;
  const exh = yearPremium * (s.lrExhaustPct ?? 0) / 100;
  return Math.min(Math.max(0, yearGross - att), Math.max(0, exh - att));
};

const treatyMatches = (t: Treaty, s: PricingStructure): boolean => {
  if (s.linkedTreatyId) return t.id === s.linkedTreatyId;
  if (s.cedant && t.cedant.toLowerCase() !== s.cedant.toLowerCase()) return false;
  if (s.contractNumber && !t.contractNumber.toLowerCase().includes(s.contractNumber.toLowerCase())) return false;
  return s.linesOfBusiness.length === 0 ||
    t.lineOfBusiness.some(lob => s.linesOfBusiness.includes(lob));
};

/**
 * Build the trended experience table for the structure's business scope.
 * Premium is allocated to a treaty's inception year; losses to accident year.
 */
export const buildExperience = (
  claims: Claim[],
  treaties: Treaty[],
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  externalRows: ExternalExperienceRow[] = []
): ExperienceYear[] => {
  const scopeTreaties = treaties.filter(t => treatyMatches(t, structure));
  const treatyIds = new Set(scopeTreaties.map(t => t.id));
  const scopeClaims = claims.filter(c => treatyIds.has(c.treatyId));
  const scopedExternal = scopeExternalRows(externalRows, structure);

  const years = new Map<number, { premium: number; gross: number; inStructure: number; count: number }>();
  const bucket = (y: number) => {
    if (!years.has(y)) years.set(y, { premium: 0, gross: 0, inStructure: 0, count: 0 });
    return years.get(y)!;
  };

  scopeTreaties.forEach(t => {
    const y = new Date(t.inceptionDate).getFullYear();
    if (!isNaN(y)) bucket(y).premium += inflate(t.premium, y, assumptions.premiumTrendPct);
  });

  scopeClaims.forEach(c => {
    const y = new Date(c.dateOfLoss).getFullYear();
    if (isNaN(y)) return;
    const trended = inflate(claimIncurred(c), y, assumptions.claimsInflationPct);
    const b = bucket(y);
    b.gross += trended;
    b.inStructure += structure.treatyType === 'Stop Loss' ? 0 : lossToStructure(trended, structure);
    b.count += 1;
  });

  // Imported experience: premium adds to the year; aggregate losses are
  // exploded into average-severity losses so per-claim structure mapping applies
  scopedExternal.forEach(row => {
    const b = bucket(row.year);
    b.premium += inflate(row.premium, row.year, assumptions.premiumTrendPct);
    explodeLosses(row).forEach(loss => {
      const trended = inflate(loss, row.year, assumptions.claimsInflationPct);
      b.gross += trended;
      b.inStructure += structure.treatyType === 'Stop Loss' ? 0 : lossToStructure(trended, structure);
      b.count += 1;
    });
  });

  return Array.from(years.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => {
      const inStructure = structure.treatyType === 'Stop Loss'
        ? yearLossesToStructure(v.gross, v.premium, structure)
        : v.inStructure;
      return {
        year,
        premium: v.premium,
        losses: v.gross,
        lossesInStructure: inStructure,
        claimCount: v.count,
        lossRatioPct: v.premium > 0 ? (inStructure / v.premium) * 100 : null
      };
    });
};

/** Burning cost: average in-structure losses over average premium, applied to subject premium. */
export const burningCost = (experience: ExperienceYear[], structure: PricingStructure): MethodResult => {
  const withPremium = experience.filter(e => e.premium > 0);
  const totalPremium = withPremium.reduce((s, e) => s + e.premium, 0);
  const totalLosses = withPremium.reduce((s, e) => s + e.lossesInStructure, 0);
  const rate = totalPremium > 0 ? totalLosses / totalPremium : 0;
  const lossCost = structure.subjectPremium * rate;
  return {
    method: 'burningCost',
    lossCost,
    lossCostRatePct: rate * 100,
    note: `${withPremium.length} year(s), trended losses ${Math.round(totalLosses).toLocaleString()} / premium ${Math.round(totalPremium).toLocaleString()}`,
    usable: withPremium.length >= 1 && totalPremium > 0
  };
};

/** Experience rating: burning cost excluding the worst year (if ≥3 years) plus a stability margin. */
export const experienceRating = (experience: ExperienceYear[], structure: PricingStructure): MethodResult => {
  const usableYears = experience.filter(e => e.premium > 0);
  if (usableYears.length < 2) {
    return { method: 'experience', lossCost: 0, lossCostRatePct: null, note: 'Needs at least 2 experience years', usable: false };
  }
  // Trim the single worst loss-ratio year when history is long enough
  const sorted = [...usableYears].sort((a, b) => (b.lossRatioPct ?? 0) - (a.lossRatioPct ?? 0));
  const kept = usableYears.length >= 3 ? sorted.slice(1) : sorted;
  const premium = kept.reduce((s, e) => s + e.premium, 0);
  const losses = kept.reduce((s, e) => s + e.lossesInStructure, 0);
  const rate = premium > 0 ? losses / premium : 0;
  // Stability margin: half the spread between raw and trimmed burning cost
  const rawRate = usableYears.reduce((s, e) => s + e.lossesInStructure, 0) /
                  Math.max(1, usableYears.reduce((s, e) => s + e.premium, 0));
  const adjusted = rate + Math.max(0, (rawRate - rate) / 2);
  return {
    method: 'experience',
    lossCost: structure.subjectPremium * adjusted,
    lossCostRatePct: adjusted * 100,
    note: usableYears.length >= 3
      ? `Worst year trimmed, half-spread stability margin (raw ${(rawRate * 100).toFixed(1)}%)`
      : 'Simple average (too few years to trim)',
    usable: true
  };
};
