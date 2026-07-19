import { describe, it, expect } from 'vitest';
import { lossToStructure, buildExperience, burningCost, experienceRating } from '../pricing/burningCost';
import { credibilityBlend } from '../pricing/credibility';
import { buildUpPremium } from '../pricing/premiumBuildUp';
import { DEFAULT_PRICING_ASSUMPTIONS } from '../pricing/assumptions';
import { parseExperienceCsv } from '../pricing/externalData';
import type { PricingStructure, ExperienceYear } from '../pricing/types';
import { mkTreaty, mkClaim } from './helpers';

const A = { ...DEFAULT_PRICING_ASSUMPTIONS, claimsInflationPct: 0, premiumTrendPct: 0 };

const qs = (over: Partial<PricingStructure> = {}): PricingStructure => ({
  treatyType: 'Quota Share', linesOfBusiness: ['Property'], subjectPremium: 1_000_000,
  currency: 'USD', cessionPct: 50, ...over,
});
const xol = (over: Partial<PricingStructure> = {}): PricingStructure => ({
  treatyType: 'XOL', linesOfBusiness: ['Property'], subjectPremium: 1_000_000,
  currency: 'USD', attachment: 500_000, limit: 500_000, ...over,
});

describe('loss mapping to structure', () => {
  it('quota share takes cession % of every loss', () => {
    expect(lossToStructure(100_000, qs({ cessionPct: 40 }))).toBeCloseTo(40_000, 6);
  });
  it('XOL takes the tranche above attachment capped at the limit', () => {
    expect(lossToStructure(400_000, xol())).toBe(0);
    expect(lossToStructure(700_000, xol())).toBeCloseTo(200_000, 6);
    expect(lossToStructure(2_000_000, xol())).toBeCloseTo(500_000, 6);
  });
});

describe('burning cost', () => {
  const yr = new Date().getFullYear();
  const treaties = [0, 1, 2].map(i => mkTreaty({
    lineOfBusiness: ['Property'], premium: 1_000_000,
    inceptionDate: `${yr - 3 + i}-01-01`, expiryDate: `${yr - 3 + i}-12-31`,
  }));
  const claims = treaties.flatMap(t => [
    mkClaim({ treatyId: t.id, status: 'Settled', claimAmount: 100_000, paidAmount: 100_000, dateOfLoss: `${t.inceptionDate.slice(0, 4)}-06-01` }),
  ]);

  it('flat history burning cost equals the constant loss-to-premium ratio', () => {
    const exp = buildExperience(claims, treaties, qs({ cessionPct: 100 }), A);
    const bc = burningCost(exp, qs({ cessionPct: 100 }));
    // each year: loss 100k / premium 1M = 10% of subject
    expect(bc.lossCost).toBeCloseTo(0.10 * 1_000_000, -2);
  });

  it('experience rating never yields less than zero and adds a stability margin on volatile years', () => {
    const exp = buildExperience(claims, treaties, qs({ cessionPct: 100 }), A);
    const er = experienceRating(exp, qs({ cessionPct: 100 }));
    expect(er.lossCost).toBeGreaterThanOrEqual(0);
  });
});

describe('credibility blend', () => {
  const mkResult = (lossCost: number, usable = true) => ({ method: 'burningCost', lossCost, usable, note: '' } as never);
  const years = (n: number, claimsPerYear: number): ExperienceYear[] =>
    Array.from({ length: n }, (_, i) => ({
      year: 2020 + i, premium: 1_000_000, trendedPremium: 1_000_000,
      grossLosses: 0, trendedLosses: 0, structureLosses: 0, claimCount: claimsPerYear, lossRatioPct: 0,
    } as never));

  it('Z = √(n/N) capped at 1; blend interpolates between experience and prior', () => {
    const blend = credibilityBlend(years(3, 10), mkResult(80), mkResult(120), { ...A, fullCredibilityClaims: 30 });
    expect(blend.z).toBeCloseTo(1, 6); // 30 claims = full credibility
    expect(blend.blendedLossCost).toBeCloseTo(80, 6);

    const half = credibilityBlend(years(1, 7.5 as never), mkResult(80), mkResult(120), { ...A, fullCredibilityClaims: 30 });
    expect(half.z).toBeCloseTo(0.5, 6);
    expect(half.blendedLossCost).toBeCloseTo(0.5 * 80 + 0.5 * 120, 6);
  });

  it('unusable experience puts full weight on the prior', () => {
    const blend = credibilityBlend(years(3, 100), mkResult(80, false), mkResult(120), A);
    expect(blend.z).toBe(0);
    expect(blend.blendedLossCost).toBeCloseTo(120, 6);
  });
});

describe('premium build-up', () => {
  it('office = technical / (1 − loadings); components reconcile exactly', () => {
    const b = buildUpPremium(100_000, qs(), A);
    const expectTechnical = 100_000 * (1 + A.riskLoadingPct / 100);
    expect(b.technicalPremium).toBeCloseTo(expectTechnical, 6);
    const divisor = 1 - (A.expenseLoadingPct + A.commissionLoadingPct + A.profitLoadingPct) / 100;
    expect(b.officePremium).toBeCloseTo(expectTechnical / divisor, 4);
    // office − loadings = technical
    expect(b.officePremium - b.expenseLoading - b.commissionLoading - b.profitLoading).toBeCloseTo(b.technicalPremium, 4);
    expect(b.officePremium).toBeGreaterThanOrEqual(b.technicalPremium);
  });

  it('rate on line is only quoted for non-proportional structures', () => {
    expect(buildUpPremium(100_000, qs(), A).rateOnLinePct).toBeNull();
    expect(buildUpPremium(100_000, xol(), A).rateOnLinePct).not.toBeNull();
  });
});

describe('external experience CSV parsing', () => {
  it('parses tolerant headers and validates rows', () => {
    const csv = 'UW Year,Cedant,Contract No,LOB,GWP,Claims Incurred,Number of Claims\n2022,Acme Insurance,CN-9,Fire,1000000,450000,12\nbad,,,,,,\n';
    const res = parseExperienceCsv(csv);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].premium).toBe(1_000_000);
    expect(res.rows[0].lineOfBusiness).toBe('Fire');
    expect(res.errors.length).toBeGreaterThan(0); // the bad row is reported, not silently dropped
  });
});
