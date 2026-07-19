import { describe, it, expect } from 'vitest';
import { lrcRollForward } from '../ifrs17/lrc';
import { licRollForward, allocateIbnr } from '../ifrs17/lic';
import { riskAdjustment } from '../ifrs17/riskAdjustment';
import { DEFAULT_IFRS17_ASSUMPTIONS } from '../ifrs17/assumptions';
import { mkTreaty, mkClaim } from './helpers';

const A = { ...DEFAULT_IFRS17_ASSUMPTIONS, valuationDate: '2023-07-02', riskAdjustmentMethod: 'percentOfReserves' as const, riskAdjustmentPercent: 10 };

describe('risk adjustment', () => {
  it('is zero on a non-positive base and scales linearly for % of reserves', () => {
    expect(riskAdjustment(0, A)).toBe(0);
    expect(riskAdjustment(-50, A)).toBe(0);
    expect(riskAdjustment(1000, A)).toBeCloseTo(100, 6);
  });
  it('confidence level and cost of capital methods stay positive', () => {
    expect(riskAdjustment(1000, { ...A, riskAdjustmentMethod: 'confidenceLevel' })).toBeGreaterThan(0);
    expect(riskAdjustment(1000, { ...A, riskAdjustmentMethod: 'costOfCapital' })).toBeGreaterThan(0);
  });
});

describe('LIC roll-forward', () => {
  const treaty = mkTreaty();
  it('closing = case reserves + IBNR + RA; identities hold', () => {
    const open = mkClaim({ treatyId: treaty.id, status: 'Outstanding', claimAmount: 100, reserveAmount: 100 });
    const paid = mkClaim({ treatyId: treaty.id, status: 'Settled', claimAmount: 60, paidAmount: 60 });
    const lic = licRollForward(treaty, [open, paid], A, 40);
    const caseReserves = lic.claimsIncurred - lic.claimsPaid; // 100
    expect(caseReserves).toBeCloseTo(100, 6);
    const ra = riskAdjustment(caseReserves + 40, A);
    expect(lic.closingBalance).toBeCloseTo(caseReserves + 40 + ra, 6);
  });

  it('IBNR allocation distributes the full amount and only to treaties with exposure', () => {
    const t1 = mkTreaty();
    const t2 = mkTreaty();
    const claims = [
      mkClaim({ treatyId: t1.id, status: 'Outstanding', claimAmount: 300, reserveAmount: 300 }),
      mkClaim({ treatyId: t2.id, status: 'Outstanding', claimAmount: 100, reserveAmount: 100 }),
    ];
    const alloc = allocateIbnr([t1, t2], claims, 1000);
    const total = Object.values(alloc).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1000, 4);
    expect(alloc[t1.id]).toBeGreaterThan(alloc[t2.id]); // proportional to exposure
  });
});

describe('LRC roll-forward (PAA)', () => {
  it('mid-term treaty: closing = received − earned premium − amortised acquisition', () => {
    // 1 Jan – 31 Dec 2023 treaty valued 2 July 2023 → ~50% earned
    const treaty = mkTreaty({ inceptionDate: '2023-01-01', expiryDate: '2023-12-31', premium: 1000, commission: 20 });
    const lrc = lrcRollForward(treaty, [], A, 65);
    expect(lrc.model).toBe('PAA'); // 12-month coverage → PAA
    expect(lrc.earnedFraction).toBeGreaterThan(0.45);
    expect(lrc.earnedFraction).toBeLessThan(0.55);
    expect(lrc.closingBalance).toBeCloseTo(
      lrc.premiumReceived - lrc.revenueRecognized - lrc.acquisitionCashFlows, 6);
  });

  it('fully expired treaty recognises all revenue (earned fraction = 1)', () => {
    const treaty = mkTreaty({ inceptionDate: '2021-01-01', expiryDate: '2021-12-31', premium: 500 });
    const lrc = lrcRollForward(treaty, [], A, 65);
    expect(lrc.earnedFraction).toBeCloseTo(1, 6);
    expect(lrc.revenueRecognized).toBeCloseTo(500, 6);
  });

  it('multi-year coverage is measured under GMM, and CSM is never negative', () => {
    const treaty = mkTreaty({ inceptionDate: '2023-01-01', expiryDate: '2025-12-31', premium: 3000 });
    const lrc = lrcRollForward(treaty, [], A, 65);
    expect(lrc.model).toBe('GMM');
    expect(lrc.csm).toBeGreaterThanOrEqual(0);
    // a loss-making ELR produces a loss component instead of negative CSM
    const lossy = lrcRollForward(treaty, [], A, 180);
    expect(lossy.csm).toBeGreaterThanOrEqual(0);
    expect(lossy.lossComponent).toBeGreaterThanOrEqual(0);
  });
});
