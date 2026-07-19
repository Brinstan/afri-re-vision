import { describe, it, expect } from 'vitest';
import { reinsuranceHeld } from '../ifrs17/financialStatements';
import { deriveJournals } from '../accounting/journals';
import { DEFAULT_IFRS17_ASSUMPTIONS } from '../ifrs17/assumptions';
import type { RetroClaim } from '../components/DataStore';
import { mkTreaty, mkClaim, mkProgramme, mkLayer } from './helpers';

const A = { ...DEFAULT_IFRS17_ASSUMPTIONS, valuationDate: '2024-01-01' };

describe('G-08: IFRS 17 Reinsurance Held follows programmes when they exist', () => {
  const treaty = mkTreaty({
    retroPercentage: 30, premium: 1_000_000,
    lineOfBusiness: ['Property'], inceptionDate: '2023-01-01', expiryDate: '2023-12-31',
  });
  const claim = mkClaim({ treatyId: treaty.id, status: 'Settled', claimAmount: 500_000, paidAmount: 500_000, dateOfLoss: '2023-06-01' });

  it('legacy basis applies only without programmes', () => {
    const held = reinsuranceHeld([treaty], [claim], A);
    expect(held.cededPremium).toBeCloseTo(300_000, 2); // 30% fully earned
  });

  it('programme basis: ceded premium = earned layer premiums; recoveries from the engine', () => {
    const prog = mkProgramme({
      type: 'Quota Share', cessionPct: 40, linesOfBusiness: ['Property'],
      effectiveDate: '2023-01-01', expiryDate: '2023-12-31',
      layers: [mkLayer({ premium: 150_000 })],
    });
    const held = reinsuranceHeld([treaty], [claim], A, [prog], []);
    expect(held.cededPremium).toBeCloseTo(150_000, 2);       // programme premium, fully earned
    expect(held.recoveries).toBeCloseTo(200_000, 2);          // 40% of the 500k claim
    // legacy retroPercentage must NOT leak in when programmes exist
    expect(held.cededPremium).not.toBeCloseTo(300_000, 2);
  });
});

describe('G-09: reinstatement premium journal on XOL retro recovery settlement', () => {
  const treaty = mkTreaty({ lineOfBusiness: ['Property'], inceptionDate: '2023-01-01', expiryDate: '2023-12-31' });
  const xol = mkProgramme({
    type: 'XOL', linesOfBusiness: ['Property'],
    reinstatementsCount: 1, reinstatementRatePct: 100,
    layers: [mkLayer({ id: 'L1', attachmentPoint: 500_000, limit: 1_000_000, premium: 80_000 })],
  });
  const settled: RetroClaim = {
    id: 'RC1', originalClaimId: 'C1', programmeId: xol.id, layerId: 'L1',
    status: 'Settled', settledRecovery: 500_000,
    notificationDate: '2023-09-01', settlementDate: '2023-10-01',
  } as RetroClaim;

  it('books recovery AND pro-rata reinstatement premium, both balanced', () => {
    const journals = deriveJournals([treaty], [], [], 0, [xol], [settled]);
    const recovery = journals.find(j => j.journalNumber === 'JN-RS-RC1');
    const reinstatement = journals.find(j => j.journalNumber === 'JN-RIP-RC1');
    expect(recovery).toBeDefined();
    expect(reinstatement).toBeDefined();
    // 500k recovered of 1M limit → 50% pro-rata × 80k premium × 100% rate = 40k
    const amount = reinstatement!.lines.reduce((s, l) => s + l.debit, 0);
    expect(amount).toBeCloseTo(40_000, 2);
    [recovery!, reinstatement!].forEach(j => {
      const d = j.lines.reduce((s, l) => s + l.debit, 0);
      const c = j.lines.reduce((s, l) => s + l.credit, 0);
      expect(d).toBeCloseTo(c, 6);
    });
  });

  it('no reinstatement journal for proportional programmes or zero-rate covers', () => {
    const qs = mkProgramme({ type: 'Quota Share', cessionPct: 50, linesOfBusiness: ['Property'], layers: [mkLayer({ id: 'L2' })] });
    const rc = { ...settled, id: 'RC2', programmeId: qs.id, layerId: 'L2' } as RetroClaim;
    const journals = deriveJournals([treaty], [], [], 0, [qs], [rc]);
    expect(journals.find(j => j.journalNumber === 'JN-RIP-RC2')).toBeUndefined();
  });
});
