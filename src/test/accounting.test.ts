import { describe, it, expect } from 'vitest';
import { deriveJournals } from '../accounting/journals';
import { trialBalance, trialBalanceTotals } from '../accounting/trialBalance';
import { translate, DEFAULT_FX_RATES } from '../accounting/currency';
import type { LedgerEntry } from '../accounting/types';
import { mkTreaty, mkClaim, mkProgramme, mkLayer } from './helpers';

const balanced = (lines: { debit: number; credit: number }[]) => {
  const d = lines.reduce((s, l) => s + l.debit, 0);
  const c = lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(d - c) < 1e-6;
};

describe('derived journals', () => {
  const treaty = mkTreaty({
    premium: 1_000_000,
    commission: 25,
    retroPercentage: 10,
    premiumBookings: [
      { id: 'B1', type: 'Premium Booking', amount: 250_000, date: '2023-03-31', status: 'Paid', paidDate: '2023-04-15' },
    ],
  } as never);
  const settledClaim = mkClaim({
    treatyId: treaty.id, contractNumber: treaty.contractNumber,
    status: 'Settled', claimAmount: 80_000, paidAmount: 80_000, paymentDate: '2023-09-01',
  });

  it('every derived journal balances', () => {
    const journals = deriveJournals([treaty], [settledClaim], [], 50_000);
    expect(journals.length).toBeGreaterThan(0);
    journals.forEach(j => expect(balanced(j.lines), j.journalNumber).toBe(true));
  });

  it('journal numbers are stable across reruns (same inputs → same ids)', () => {
    const a = deriveJournals([treaty], [settledClaim], [], 50_000).map(j => j.journalNumber);
    const b = deriveJournals([treaty], [settledClaim], [], 50_000).map(j => j.journalNumber);
    expect(a).toEqual(b);
  });

  it('programme-based retro suppresses the legacy per-treaty retro journal', () => {
    const prog = mkProgramme({ layers: [mkLayer({ premium: 120_000 })] });
    const withProgramme = deriveJournals([treaty], [], [], 0, [prog], []);
    const withoutProgramme = deriveJournals([treaty], [], [], 0, [], []);
    const legacyIn = (js: typeof withProgramme) => js.filter(j => j.journalNumber.startsWith('JN-RP-') && j.reference === treaty.id);
    // legacy per-treaty retro exists only when no programmes are defined
    expect(withoutProgramme.some(j => j.narration.toLowerCase().includes('retro'))).toBe(true);
    expect(legacyIn(withProgramme).length).toBe(0);
  });
});

describe('trial balance', () => {
  const entry = (code: string, name: string, d: number, c: number): LedgerEntry => ({
    journalNumber: 'JN-X', postingDate: '2023-06-30', reference: 'r', currency: 'USD',
    accountCode: code, accountName: name, debit: d, credit: c,
    debitReporting: d, creditReporting: c,
    sourceModule: 'Treaty', status: 'Posted', postedBy: 'test',
  } as LedgerEntry);

  it('debits always equal credits in totals when entries come from balanced journals', () => {
    const rows = trialBalance([
      entry('1100', 'Premium Receivable', 500, 0),
      entry('4000', 'Written Premium', 0, 500),
      entry('5000', 'Claims Paid', 200, 0),
      entry('1010', 'Bank', 0, 200),
    ], 'adjusted');
    const t = trialBalanceTotals(rows);
    expect(t.debit).toBeCloseTo(t.credit, 6);
  });

  it('presents net balance on the natural side (no account shows both)', () => {
    const rows = trialBalance([
      entry('1100', 'Premium Receivable', 500, 0),
      entry('1100', 'Premium Receivable', 0, 200),
      entry('4000', 'Written Premium', 0, 300),
    ], 'adjusted');
    const ar = rows.find(r => r.accountCode === '1100')!;
    expect(ar.debit).toBe(300);
    expect(ar.credit).toBe(0);
  });
});

describe('currency translation', () => {
  it('reporting-currency translate is identity; cross-rate reciprocity holds', () => {
    expect(translate(100, 'USD', DEFAULT_FX_RATES)).toBeCloseTo(100, 9);
    // 100 TZS → USD, then USD → TZS via a TZS reporting book must round-trip
    const usd = translate(100, 'TZS', DEFAULT_FX_RATES);
    const tzsBook = { ...DEFAULT_FX_RATES, reportingCurrency: 'TZS' };
    expect(translate(usd, 'USD', tzsBook)).toBeCloseTo(100, 6);
  });
});
