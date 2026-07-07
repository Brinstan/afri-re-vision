// Draft financial statements built from the adjusted trial balance and the
// cash book: SoFP, P&L, cash flow (direct method, simplified), changes in
// equity, technical account, and a management summary.

import { TECHNICAL_ACCOUNT_CODES } from './chartOfAccounts';
import { CashTransaction, TrialBalanceRow } from './types';

const sumWhere = (rows: TrialBalanceRow[], pred: (r: TrialBalanceRow) => boolean): number =>
  rows.filter(pred).reduce((s, r) => s + (r.debit - r.credit), 0);

export interface StatementLine { label: string; amount: number; emphasis?: boolean }

export interface StatementsBundle {
  profitOrLoss: StatementLine[];
  netProfit: number;
  financialPosition: { assets: StatementLine[]; liabilities: StatementLine[]; equity: StatementLine[] };
  cashFlow: StatementLine[];
  changesInEquity: StatementLine[];
  technicalAccount: StatementLine[];
  technicalResult: number;
}

export const buildStatements = (
  adjustedTb: TrialBalanceRow[],
  cashBook: CashTransaction[],
  openingCash: number
): StatementsBundle => {
  const rows = adjustedTb;

  // ---- Profit or Loss (credit-natural accounts are negative in net-debit terms)
  const revenueBy = (code: string) => -sumWhere(rows, r => r.accountCode === code);
  const expenseBy = (code: string) => sumWhere(rows, r => r.accountCode === code || r.accountCode.startsWith(code.slice(0, 3)) && false);

  const gwp = revenueBy('4000');
  const reinstatement = revenueBy('4010');
  const retroRecoveryIncome = revenueBy('4100');
  const investmentIncome = revenueBy('4200');
  const fxGain = revenueBy('4300');
  const claimsIncurred = sumWhere(rows, r => r.accountCode === '5000');
  const ibnrMovement = sumWhere(rows, r => r.accountCode === '5010');
  const commissionExpense = sumWhere(rows, r => r.accountCode === '5100');
  const retroCeded = sumWhere(rows, r => r.accountCode === '5200');
  const operatingExpenses = sumWhere(rows, r => r.accountCode === '5300');
  const taxExpense = sumWhere(rows, r => r.accountCode === '5400');
  const fxLoss = sumWhere(rows, r => r.accountCode === '5500');

  const totalRevenue = gwp + reinstatement + retroRecoveryIncome + investmentIncome + fxGain;
  const totalExpenses = claimsIncurred + ibnrMovement + commissionExpense + retroCeded + operatingExpenses + taxExpense + fxLoss;
  const netProfit = totalRevenue - totalExpenses;

  const profitOrLoss: StatementLine[] = [
    { label: 'Gross written premium', amount: gwp },
    { label: 'Reinstatement premium income', amount: reinstatement },
    { label: 'Retrocession recovery income', amount: retroRecoveryIncome },
    { label: 'Investment income', amount: investmentIncome },
    { label: 'Exchange gain', amount: fxGain },
    { label: 'Total revenue', amount: totalRevenue, emphasis: true },
    { label: 'Gross claims incurred', amount: -claimsIncurred },
    { label: 'IBNR movement', amount: -ibnrMovement },
    { label: 'Broker commission expense', amount: -commissionExpense },
    { label: 'Retrocession premium ceded', amount: -retroCeded },
    { label: 'Operating expenses', amount: -operatingExpenses },
    { label: 'Tax and exchange loss', amount: -(taxExpense + fxLoss) },
    { label: 'Total expenses', amount: -totalExpenses, emphasis: true },
    { label: 'Net profit / (loss)', amount: netProfit, emphasis: true }
  ];

  // ---- Statement of Financial Position
  const asset = (code: string) => sumWhere(rows, r => r.accountCode === code);
  const liability = (code: string) => -sumWhere(rows, r => r.accountCode === code);

  const cashAndBank = asset('1010') + openingCash;
  const premiumReceivables = asset('1100');
  const retroRecoverables = asset('1200');
  const investmentsAsset = asset('1310') + asset('1320');
  const totalAssets = cashAndBank + premiumReceivables + retroRecoverables + investmentsAsset;

  const outstandingClaims = liability('2000');
  const ibnrReserve = liability('2010');
  const commissionPayable = liability('2100');
  const retroPayable = liability('2200');
  const otherPayables = liability('2300') + liability('2400');
  const totalLiabilities = outstandingClaims + ibnrReserve + commissionPayable + retroPayable + otherPayables;

  const equityResult = totalAssets - totalLiabilities; // retained result plug (no share capital journalised)

  const financialPosition = {
    assets: [
      { label: 'Cash & bank balances', amount: cashAndBank },
      { label: 'Premium receivables', amount: premiumReceivables },
      { label: 'Retrocession recoverables', amount: retroRecoverables },
      { label: 'Investments', amount: investmentsAsset },
      { label: 'Total assets', amount: totalAssets, emphasis: true }
    ],
    liabilities: [
      { label: 'Outstanding claims reserve', amount: outstandingClaims },
      { label: 'IBNR reserve', amount: ibnrReserve },
      { label: 'Broker commission payable', amount: commissionPayable },
      { label: 'Retrocession premium payable', amount: retroPayable },
      { label: 'Other payables & tax', amount: otherPayables },
      { label: 'Total liabilities', amount: totalLiabilities, emphasis: true }
    ],
    equity: [
      { label: 'Retained result (derived)', amount: equityResult },
      { label: 'Total equity', amount: equityResult, emphasis: true }
    ]
  };

  // ---- Cash flow (direct, from the cash book)
  const receipts = cashBook.filter(t => t.type === 'Receipt');
  const payments = cashBook.filter(t => t.type === 'Payment');
  const premiumsReceived = receipts.filter(t => t.sourceModule === 'Treaty Management').reduce((s, t) => s + t.amount, 0);
  const investmentReceipts = receipts.filter(t => t.sourceModule === 'Investments').reduce((s, t) => s + t.amount, 0);
  const claimsPaidCash = payments.filter(t => t.sourceModule === 'Claims').reduce((s, t) => s + t.amount, 0);
  const investmentsPlaced = payments.filter(t => t.sourceModule === 'Investments').reduce((s, t) => s + t.amount, 0);
  const netOperating = premiumsReceived - claimsPaidCash;
  const netInvesting = investmentReceipts - investmentsPlaced;

  const cashFlow: StatementLine[] = [
    { label: 'Premiums received from cedants', amount: premiumsReceived },
    { label: 'Claims paid', amount: -claimsPaidCash },
    { label: 'Net cash from operating activities', amount: netOperating, emphasis: true },
    { label: 'Investment income received', amount: investmentReceipts },
    { label: 'Investments placed', amount: -investmentsPlaced },
    { label: 'Net cash from investing activities', amount: netInvesting, emphasis: true },
    { label: 'Opening cash & bank', amount: openingCash },
    { label: 'Closing cash & bank', amount: openingCash + netOperating + netInvesting, emphasis: true }
  ];

  // ---- Changes in equity (single-period)
  const changesInEquity: StatementLine[] = [
    { label: 'Opening equity', amount: 0 },
    { label: 'Net profit / (loss) for the period', amount: netProfit },
    { label: 'Other movements (derived balances)', amount: equityResult - netProfit },
    { label: 'Closing equity', amount: equityResult, emphasis: true }
  ];

  // ---- Technical account (underwriting result)
  const technicalRevenue = gwp + reinstatement + retroRecoveryIncome;
  const technicalExpense = claimsIncurred + ibnrMovement + commissionExpense + retroCeded;
  const technicalResult = technicalRevenue - technicalExpense;
  const technicalAccount: StatementLine[] = [
    { label: 'Gross written premium', amount: gwp },
    { label: 'Reinstatement premiums', amount: reinstatement },
    { label: 'Retrocession recoveries', amount: retroRecoveryIncome },
    { label: 'Gross claims incurred', amount: -claimsIncurred },
    { label: 'IBNR movement', amount: -ibnrMovement },
    { label: 'Acquisition costs (commission)', amount: -commissionExpense },
    { label: 'Retrocession premium ceded', amount: -retroCeded },
    { label: 'Technical result', amount: technicalResult, emphasis: true }
  ];

  return { profitOrLoss, netProfit, financialPosition, cashFlow, changesInEquity, technicalAccount, technicalResult };
};

export { TECHNICAL_ACCOUNT_CODES };
