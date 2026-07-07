// Shared types for the enterprise accounting layer.

export type AccountCategory =
  | 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses' | 'Technical';

export interface Account {
  code: string;                // e.g. '1100'
  name: string;
  category: AccountCategory;
  parent?: string;             // parent account code for hierarchy
  /** Normal balance side — determines trial balance presentation. */
  normalSide: 'debit' | 'credit';
  description?: string;
}

export type JournalSource =
  | 'Premium Booking' | 'Premium Receipt' | 'Claim Registration' | 'Claim Payment'
  | 'Reinsurance Recovery' | 'Broker Commission' | 'Retrocession Premium'
  | 'Retrocession Recovery' | 'Reinstatement Premium' | 'IFRS Adjustment'
  | 'Investment Purchase' | 'Investment Income' | 'Manual';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;               // amounts in transaction currency
  credit: number;
}

export interface Journal {
  journalNumber: string;       // stable, derived from source entity
  postingDate: string;
  reference: string;           // business reference (booking id, claim number, …)
  currency: string;
  lines: JournalLine[];        // balanced: Σdebit = Σcredit
  sourceModule: JournalSource;
  treatyReference?: string;    // contract number
  claimReference?: string;     // claim number
  status: 'Posted' | 'Adjustment';
  postedBy: string;
  narration: string;
}

export interface LedgerEntry {
  journalNumber: string;
  postingDate: string;
  reference: string;
  currency: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  /** Amounts translated to the reporting currency at the applied rate. */
  debitReporting: number;
  creditReporting: number;
  sourceModule: JournalSource;
  treatyReference?: string;
  claimReference?: string;
  status: string;
  postedBy: string;
  narration: string;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  category: AccountCategory;
  debit: number;               // reporting currency
  credit: number;
}

export interface AgingBucket {
  label: string;               // 'Current' | '31-60' | '61-90' | '90+'
  amount: number;
}

export interface ReceivableRow {
  key: string;                 // treaty / broker / cedant name
  reference: string;
  type: 'Premium' | 'Broker' | 'Cedant';
  currency: string;
  totalBooked: number;
  totalPaid: number;
  outstanding: number;
  oldestDueDate: string | null;
  daysOutstanding: number | null;
  agingBucket: string;
  collectionStatus: 'Current' | 'Follow-up' | 'Overdue' | 'Settled';
}

export interface PayableRow {
  key: string;
  reference: string;
  type: 'Claims' | 'Commission' | 'Retrocession' | 'Supplier';
  currency: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  status: 'Outstanding' | 'Partially Paid' | 'Paid';
}

export interface CashTransaction {
  date: string;
  bankAccountId: string;
  description: string;
  reference: string;
  type: 'Receipt' | 'Payment';
  amount: number;              // account currency
  sourceModule: string;
}

export interface FxRates {
  /** Units of reporting currency per 1 unit of key currency (closing rate). */
  closing: Record<string, number>;
  /** Historical (average) rate used for P&L items. */
  historical: Record<string, number>;
  reportingCurrency: string;
}
