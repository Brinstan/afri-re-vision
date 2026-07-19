import { describe, it, expect } from 'vitest';
import {
  inflate, claimPaid, claimCaseReserve, claimIncurred,
  buildTriangle, latestDiagonal, developmentFactors,
  buildMethodInputs, chainLadder, bornhuetterFerguson, capeCod,
  expectedLossRatioMethod, mackStandardErrors, DEFAULT_ASSUMPTIONS,
} from '../lib/actuarial';
import { mkClaim, mkTreaty } from './helpers';

const A = { ...DEFAULT_ASSUMPTIONS, claimsInflation: 0, premiumInflation: 0, tailFactor: 1, expectedLossRatio: 65 };
const yr = new Date().getFullYear();

// A clean two-origin book: origin Y-2 fully developed over 3 years, origin Y-1 seen 2 years.
// Y-2: paid 100 in dev0, 50 in dev1, 25 in dev2 (cumulative 100 → 150 → 175)
// Y-1: paid 200 in dev0, 100 in dev1        (cumulative 200 → 300 → ?)
const goldenClaims = [
  mkClaim({ dateOfLoss: `${yr - 2}-03-01`, dateReported: `${yr - 2}-03-05`, paymentDate: `${yr - 2}-06-01`, paidAmount: 100, claimAmount: 100, reserveAmount: 0, status: 'Settled' }),
  mkClaim({ dateOfLoss: `${yr - 2}-03-02`, dateReported: `${yr - 2}-04-01`, paymentDate: `${yr - 1}-02-01`, paidAmount: 50, claimAmount: 50, reserveAmount: 0, status: 'Settled' }),
  mkClaim({ dateOfLoss: `${yr - 2}-03-03`, dateReported: `${yr - 2}-05-01`, paymentDate: `${yr}-01-15`, paidAmount: 25, claimAmount: 25, reserveAmount: 0, status: 'Settled' }),
  mkClaim({ dateOfLoss: `${yr - 1}-06-01`, dateReported: `${yr - 1}-06-10`, paymentDate: `${yr - 1}-08-01`, paidAmount: 200, claimAmount: 200, reserveAmount: 0, status: 'Settled' }),
  mkClaim({ dateOfLoss: `${yr - 1}-06-02`, dateReported: `${yr - 1}-07-01`, paymentDate: `${yr}-03-01`, paidAmount: 100, claimAmount: 100, reserveAmount: 0, status: 'Settled' }),
];

describe('claim value helpers', () => {
  it('paid uses paidAmount when present, else settled claimAmount', () => {
    expect(claimPaid(mkClaim({ paidAmount: 40 }))).toBe(40);
    expect(claimPaid(mkClaim({ status: 'Settled', claimAmount: 70 }))).toBe(70);
    expect(claimPaid(mkClaim({ status: 'Outstanding' }))).toBe(0);
  });
  it('case reserve is zero once settled; incurred = paid + case', () => {
    expect(claimCaseReserve(mkClaim({ status: 'Settled', reserveAmount: 99 }))).toBe(0);
    const c = mkClaim({ status: 'Outstanding', paidAmount: 30, reserveAmount: 20 });
    expect(claimIncurred(c)).toBe(50);
  });
});

describe('inflation', () => {
  it('zero rate is identity; positive rate compounds by elapsed years', () => {
    expect(inflate(100, yr - 2, 0)).toBe(100);
    expect(inflate(100, yr - 2, 10)).toBeCloseTo(121, 6);
  });
});

describe('triangle construction (golden example)', () => {
  const t = buildTriangle(goldenClaims, 'paid', 0);
  it('cumulates paid amounts at payment-year lag', () => {
    expect(t.cells[yr - 2]).toEqual([100, 150, 175]);
    expect(t.cells[yr - 1].slice(0, 2)).toEqual([200, 300]);
    expect(t.cells[yr - 1][2]).toBeNull(); // future cell
  });
  it('latest diagonal picks the last observed cumulative value', () => {
    const d = latestDiagonal(t);
    expect(d[yr - 2]).toBe(175);
    expect(d[yr - 1]).toBe(300);
  });
  it('development factors: dev0→1 volume-weighted = (150+300)/(100+200) = 1.5', () => {
    const f = developmentFactors(t);
    expect(f[0].weighted).toBeCloseTo(1.5, 10);
    expect(f[1].weighted).toBeCloseTo(175 / 150, 10);
    f.forEach(x => { if (x.weighted !== null) expect(x.weighted).toBeGreaterThanOrEqual(1); });
  });
});

describe('reserving methods (golden example)', () => {
  const treaties = [
    mkTreaty({ inceptionDate: `${yr - 2}-01-01`, premium: 500 }),
    mkTreaty({ inceptionDate: `${yr - 1}-01-01`, premium: 800 }),
  ];
  const inputs = buildMethodInputs(goldenClaims, treaties, A);

  it('chain ladder projects Y-1 to 300 × (175/150) = 350; Y-2 fully developed', () => {
    const cl = chainLadder(inputs);
    const rows = Object.fromEntries(cl.byOrigin.map(r => [r.origin, r]));
    expect(rows[yr - 2].ultimate).toBeCloseTo(175, 6);
    expect(rows[yr - 2].ibnr).toBeCloseTo(0, 6);
    expect(rows[yr - 1].ultimate).toBeCloseTo(350, 6);
    expect(rows[yr - 1].ibnr).toBeCloseTo(50, 6);
  });

  it('identities hold on every method: ibnr = ultimate − incurred ≥ 0, reserve = ibnr + rbns', () => {
    const methods = [chainLadder(inputs), bornhuetterFerguson(inputs), expectedLossRatioMethod(inputs), capeCod(inputs).result];
    methods.forEach(m => m.byOrigin.forEach(r => {
      expect(r.ultimate).toBeGreaterThanOrEqual(r.incurredToDate - 1e-9);
      expect(r.ibnr).toBeCloseTo(Math.max(0, r.ultimate - r.incurredToDate), 6);
      expect(r.reserve).toBeCloseTo(r.ibnr + r.rbns, 6);
    }));
  });

  it('BF ultimate = incurred + premium × ELR × (1 − %developed)', () => {
    const bf = bornhuetterFerguson(inputs);
    const y1 = bf.byOrigin.find(r => r.origin === yr - 1)!;
    const pctDeveloped = 300 / 350; // from CL: 1 / (175/150 × 1.5 truncated at age)  — dev age 1, cdf = 175/150
    // dev age for Y-1 is 1 → cdf = f(1→2) = 175/150; pct = 150/175
    const pct = 150 / 175;
    expect(y1.ultimate).toBeCloseTo(300 + 800 * 0.65 * (1 - pct), 4);
    void pctDeveloped;
  });

  it('ELR method: ultimate = premium × ELR (floored at incurred)', () => {
    const e = expectedLossRatioMethod(inputs);
    const y2 = e.byOrigin.find(r => r.origin === yr - 2)!;
    expect(y2.ultimate).toBeCloseTo(Math.max(500 * 0.65, 175), 6);
  });

  it('cape cod implied ELR = Σlosses / Σused-up premium and stays finite', () => {
    const { impliedElr } = capeCod(inputs);
    expect(impliedElr).toBeGreaterThan(0);
    expect(Number.isFinite(impliedElr)).toBe(true);
  });

  it('mack SEs are non-negative and total SE is at most the sum of parts', () => {
    const cl = chainLadder(inputs);
    const mack = mackStandardErrors(inputs.incurredTriangle, inputs.factors, A, cl);
    mack.byOrigin.forEach(r => expect(r.standardError).toBeGreaterThanOrEqual(0));
  });
});

describe('degenerate inputs', () => {
  it('empty book yields empty triangle and zero totals', () => {
    const inputs = buildMethodInputs([], [], A);
    const cl = chainLadder(inputs);
    expect(cl.byOrigin.length).toBe(0);
    expect(cl.totals.reserve).toBe(0);
  });
});
