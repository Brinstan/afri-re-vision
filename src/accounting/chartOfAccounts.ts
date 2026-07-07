// Reinsurance chart of accounts: hierarchical, categorised, with support for
// user-defined accounts persisted in localStorage.

import { Account } from './types';

export const COA_CUSTOM_KEY = 'afrirevision-coa-custom';

/** Base chart of accounts for a reinsurance company. Codes group by thousands. */
export const BASE_ACCOUNTS: Account[] = [
  // ---- Assets (1xxx)
  { code: '1000', name: 'Cash & Bank', category: 'Assets', normalSide: 'debit' },
  { code: '1010', name: 'Bank — Operating Accounts', category: 'Assets', parent: '1000', normalSide: 'debit' },
  { code: '1100', name: 'Premium Receivables', category: 'Assets', normalSide: 'debit', description: 'Premiums booked, not yet received from cedants/brokers' },
  { code: '1110', name: 'Broker Receivables', category: 'Assets', parent: '1100', normalSide: 'debit' },
  { code: '1120', name: 'Cedant Receivables', category: 'Assets', parent: '1100', normalSide: 'debit' },
  { code: '1200', name: 'Retrocession Recoverables', category: 'Assets', normalSide: 'debit', description: 'Recoveries due from retrocessionaires' },
  { code: '1300', name: 'Investments', category: 'Assets', normalSide: 'debit' },
  { code: '1310', name: 'Government Securities', category: 'Assets', parent: '1300', normalSide: 'debit' },
  { code: '1320', name: 'Equities & Corporate', category: 'Assets', parent: '1300', normalSide: 'debit' },

  // ---- Liabilities (2xxx)
  { code: '2000', name: 'Outstanding Claims Reserve', category: 'Liabilities', normalSide: 'credit', description: 'Case reserves on reported claims (RBNS)' },
  { code: '2010', name: 'IBNR Reserve', category: 'Liabilities', normalSide: 'credit', description: 'Incurred but not reported — from the Actuarial Engine' },
  { code: '2100', name: 'Broker Commission Payable', category: 'Liabilities', normalSide: 'credit' },
  { code: '2200', name: 'Retrocession Premium Payable', category: 'Liabilities', normalSide: 'credit' },
  { code: '2300', name: 'Supplier & Other Payables', category: 'Liabilities', normalSide: 'credit' },
  { code: '2400', name: 'Tax Payable', category: 'Liabilities', normalSide: 'credit' },

  // ---- Equity (3xxx)
  { code: '3000', name: 'Share Capital', category: 'Equity', normalSide: 'credit' },
  { code: '3100', name: 'Retained Earnings', category: 'Equity', normalSide: 'credit' },

  // ---- Revenue (4xxx) — technical revenue
  { code: '4000', name: 'Gross Written Premium', category: 'Revenue', normalSide: 'credit', description: 'Insurance revenue — inward reinsurance premium' },
  { code: '4010', name: 'Reinstatement Premium Income', category: 'Revenue', parent: '4000', normalSide: 'credit' },
  { code: '4100', name: 'Retrocession Recovery Income', category: 'Revenue', normalSide: 'credit', description: 'Reinsurance revenue — recoveries on ceded business' },
  { code: '4110', name: 'Retro Commission Income', category: 'Revenue', parent: '4100', normalSide: 'credit', description: 'Override commission on outward retrocession placements' },
  { code: '4200', name: 'Investment Income', category: 'Revenue', normalSide: 'credit' },
  { code: '4300', name: 'Exchange Gain', category: 'Revenue', normalSide: 'credit' },

  // ---- Expenses (5xxx) — technical expense
  { code: '5000', name: 'Gross Claims Incurred', category: 'Expenses', normalSide: 'debit', description: 'Claims expense on inward business' },
  { code: '5010', name: 'IBNR Movement', category: 'Expenses', parent: '5000', normalSide: 'debit' },
  { code: '5100', name: 'Broker Commission Expense', category: 'Expenses', normalSide: 'debit' },
  { code: '5200', name: 'Retrocession Premium Ceded', category: 'Expenses', normalSide: 'debit' },
  { code: '5300', name: 'Operating Expenses', category: 'Expenses', normalSide: 'debit' },
  { code: '5400', name: 'Tax Expense', category: 'Expenses', normalSide: 'debit' },
  { code: '5500', name: 'Exchange Loss', category: 'Expenses', normalSide: 'debit' }
];

/** Account codes belonging to the technical account (underwriting result). */
export const TECHNICAL_ACCOUNT_CODES = ['4000', '4010', '4100', '5000', '5010', '5100', '5200'];

export const loadCustomAccounts = (): Account[] => {
  try {
    const saved = localStorage.getItem(COA_CUSTOM_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const saveCustomAccounts = (accounts: Account[]) =>
  localStorage.setItem(COA_CUSTOM_KEY, JSON.stringify(accounts));

export const allAccounts = (custom: Account[] = []): Account[] =>
  [...BASE_ACCOUNTS, ...custom].sort((a, b) => a.code.localeCompare(b.code));

export const accountByCode = (code: string, custom: Account[] = []): Account | undefined =>
  allAccounts(custom).find(a => a.code === code);

export const accountName = (code: string, custom: Account[] = []): string =>
  accountByCode(code, custom)?.name ?? `Account ${code}`;

/** Group accounts by category preserving hierarchy (parents before children). */
export const accountsByCategory = (custom: Account[] = []): Record<string, Account[]> => {
  const grouped: Record<string, Account[]> = {};
  allAccounts(custom).forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });
  return grouped;
};
