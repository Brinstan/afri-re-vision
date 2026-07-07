// Cash management: cash book, registers, and bank balances derived from
// operational receipts/payments (premium receipts, claim payments, investments).

import type { BankAccount, Claim, Investment, Treaty } from '@/components/DataStore';
import { claimPaid } from '@/lib/actuarial';
import { CashTransaction } from './types';

/**
 * Derive the cash book from operational data. Receipts and payments are
 * allocated to the first bank account matching the transaction currency
 * (fallback: the first account).
 */
export const deriveCashBook = (
  treaties: Treaty[],
  claims: Claim[],
  investments: Investment[],
  bankAccounts: BankAccount[]
): CashTransaction[] => {
  const accountFor = (currency: string): string =>
    (bankAccounts.find(b => b.currency === currency) ?? bankAccounts[0])?.id ?? 'bank1';

  const txns: CashTransaction[] = [];

  treaties.forEach(t => {
    (t.premiumBookings ?? []).forEach(b => {
      const paid = b.paidAmount ?? 0;
      if (paid > 0 && !b.type.startsWith('Claim Payment')) {
        txns.push({
          date: b.date,
          bankAccountId: accountFor(t.currency),
          description: `${b.type} premium received — ${t.treatyName}`,
          reference: b.id,
          type: 'Receipt',
          amount: paid,
          sourceModule: 'Treaty Management'
        });
      }
    });
  });

  claims.forEach(c => {
    const paid = claimPaid(c);
    if (paid > 0) {
      txns.push({
        date: c.paymentDate ?? c.dateApproved ?? c.dateReported,
        bankAccountId: accountFor(c.currency),
        description: `Claim settlement — ${c.claimNumber}`,
        reference: c.paymentReference ?? c.claimNumber,
        type: 'Payment',
        amount: paid,
        sourceModule: 'Claims'
      });
    }
  });

  investments.forEach(inv => {
    txns.push({
      date: inv.investmentDate,
      bankAccountId: inv.bankAccountId ?? accountFor(inv.currency),
      description: `Investment placed — ${inv.investmentEntity}`,
      reference: inv.id,
      type: 'Payment',
      amount: inv.amount,
      sourceModule: 'Investments'
    });
    if (inv.actualReturns > 0) {
      txns.push({
        date: inv.investmentDate,
        bankAccountId: inv.bankAccountId ?? accountFor(inv.currency),
        description: `Investment income — ${inv.investmentEntity}`,
        reference: inv.id,
        type: 'Receipt',
        amount: inv.actualReturns,
        sourceModule: 'Investments'
      });
    }
  });

  return txns.sort((a, b) => a.date.localeCompare(b.date));
};

export interface BankPosition {
  account: BankAccount;
  receipts: number;
  payments: number;
  balance: number;             // opening + receipts − payments (account currency)
}

export const bankPositions = (bankAccounts: BankAccount[], cashBook: CashTransaction[]): BankPosition[] =>
  bankAccounts.map(account => {
    const txns = cashBook.filter(t => t.bankAccountId === account.id);
    const receipts = txns.filter(t => t.type === 'Receipt').reduce((s, t) => s + t.amount, 0);
    const payments = txns.filter(t => t.type === 'Payment').reduce((s, t) => s + t.amount, 0);
    return { account, receipts, payments, balance: account.openingBalance + receipts - payments };
  });

export const receiptRegister = (cashBook: CashTransaction[]): CashTransaction[] =>
  cashBook.filter(t => t.type === 'Receipt');

export const paymentRegister = (cashBook: CashTransaction[]): CashTransaction[] =>
  cashBook.filter(t => t.type === 'Payment');

// ---- Bank reconciliation: reconciled transaction refs persist locally --------

export const RECONCILED_KEY = 'afrirevision-bank-reconciled';

export const loadReconciled = (): Set<string> => {
  try {
    const saved = localStorage.getItem(RECONCILED_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
  } catch { return new Set(); }
};

export const saveReconciled = (refs: Set<string>) =>
  localStorage.setItem(RECONCILED_KEY, JSON.stringify(Array.from(refs)));

export const reconciliationKey = (t: CashTransaction): string => `${t.reference}-${t.type}`;
