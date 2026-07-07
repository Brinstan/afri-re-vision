// Trial balance: aggregate the ledger by account, in the reporting currency.
// Unadjusted = posted operational journals; adjusted adds adjustment journals
// (IBNR/IFRS provisions and manual adjustments).

import { accountByCode } from './chartOfAccounts';
import { Account, LedgerEntry, TrialBalanceRow } from './types';

export const trialBalance = (
  entries: LedgerEntry[],
  variant: 'unadjusted' | 'adjusted',
  customAccounts: Account[] = []
): TrialBalanceRow[] => {
  const scoped = variant === 'adjusted'
    ? entries
    : entries.filter(e => e.status !== 'Adjustment');

  const byAccount = new Map<string, { debit: number; credit: number; name: string }>();
  scoped.forEach(e => {
    const acc = byAccount.get(e.accountCode) ?? { debit: 0, credit: 0, name: e.accountName };
    acc.debit += e.debitReporting;
    acc.credit += e.creditReporting;
    byAccount.set(e.accountCode, acc);
  });

  return Array.from(byAccount.entries())
    .map(([code, v]) => {
      const account = accountByCode(code, customAccounts);
      // Present the net balance on the account's natural side.
      const net = v.debit - v.credit;
      return {
        accountCode: code,
        accountName: account?.name ?? v.name,
        category: account?.category ?? 'Assets',
        debit: net > 0 ? net : 0,
        credit: net < 0 ? -net : 0
      };
    })
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
};

export const trialBalanceTotals = (rows: TrialBalanceRow[]) => ({
  debit: rows.reduce((s, r) => s + r.debit, 0),
  credit: rows.reduce((s, r) => s + r.credit, 0)
});
