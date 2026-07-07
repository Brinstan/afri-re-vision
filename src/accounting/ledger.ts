// General ledger: journals flattened to account-level entries, translated to
// the reporting currency, with filtering for drill-down.

import { FxRates, Journal, LedgerEntry } from './types';
import { translate } from './currency';

export const toLedger = (journals: Journal[], rates: FxRates): LedgerEntry[] =>
  journals.flatMap(j =>
    j.lines.map(l => ({
      journalNumber: j.journalNumber,
      postingDate: j.postingDate,
      reference: j.reference,
      currency: j.currency,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.debit,
      credit: l.credit,
      debitReporting: translate(l.debit, j.currency, rates, 'closing'),
      creditReporting: translate(l.credit, j.currency, rates, 'closing'),
      sourceModule: j.sourceModule,
      treatyReference: j.treatyReference,
      claimReference: j.claimReference,
      status: j.status,
      postedBy: j.postedBy,
      narration: j.narration
    }))
  );

export interface LedgerFilters {
  account: string;       // 'all' or account code
  source: string;        // 'all' or JournalSource
  search: string;        // free text over refs/narration
}

export const filterLedger = (entries: LedgerEntry[], f: LedgerFilters): LedgerEntry[] =>
  entries.filter(e =>
    (f.account === 'all' || e.accountCode === f.account) &&
    (f.source === 'all' || e.sourceModule === f.source) &&
    (!f.search ||
      [e.journalNumber, e.reference, e.narration, e.treatyReference, e.claimReference]
        .filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(f.search.toLowerCase())))
  );

/** Net balance of an account across the ledger (reporting currency, debit-positive). */
export const accountBalance = (entries: LedgerEntry[], accountCode: string): number =>
  entries
    .filter(e => e.accountCode === accountCode)
    .reduce((s, e) => s + e.debitReporting - e.creditReporting, 0);
