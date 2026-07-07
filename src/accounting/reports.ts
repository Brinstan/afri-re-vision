// Report exports: CSV (ledger, trial balance), Excel-compatible analysis, and a
// print-to-PDF management report.

import { downloadFile } from '@/lib/actuarial';
import { StatementLine, StatementsBundle } from './financialStatements';
import { LedgerEntry, TrialBalanceRow } from './types';

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const row = (...cells: Array<string | number>) => cells.map(esc).join(',');
const money = (n: number) => Math.round(n).toLocaleString();
const stamp = () => new Date().toISOString().split('T')[0];

export const exportLedgerCsv = (entries: LedgerEntry[]) => {
  const lines = [
    row('Journal', 'Date', 'Reference', 'Account', 'Account Name', 'Currency', 'Debit', 'Credit', 'Debit (Rpt)', 'Credit (Rpt)', 'Source', 'Treaty', 'Claim', 'Status', 'Posted By', 'Narration'),
    ...entries.map(e => row(
      e.journalNumber, e.postingDate, e.reference, e.accountCode, e.accountName, e.currency,
      Math.round(e.debit), Math.round(e.credit), Math.round(e.debitReporting), Math.round(e.creditReporting),
      e.sourceModule, e.treatyReference ?? '', e.claimReference ?? '', e.status, e.postedBy, e.narration
    ))
  ];
  downloadFile(lines.join('\n'), `general-ledger-${stamp()}.csv`);
};

export const exportTrialBalanceCsv = (rows: TrialBalanceRow[], variant: string) => {
  const lines = [
    row('Account Code', 'Account Name', 'Category', 'Debit', 'Credit'),
    ...rows.map(r => row(r.accountCode, r.accountName, r.category, Math.round(r.debit), Math.round(r.credit)))
  ];
  downloadFile(lines.join('\n'), `trial-balance-${variant}-${stamp()}.csv`);
};

/** Excel-compatible full financial analysis (single CSV Excel opens directly). */
export const exportFinanceExcel = (
  tb: TrialBalanceRow[],
  statements: StatementsBundle
) => {
  const lines: string[] = [];
  const section = (title: string, body: StatementLine[]) => {
    lines.push('', row(title.toUpperCase()));
    body.forEach(l => lines.push(row(l.label, Math.round(l.amount))));
  };
  lines.push(row('AFRIREVISION FINANCIAL ANALYSIS'), row(`Generated ${new Date().toLocaleString()}`));
  section('Statement of Profit or Loss', statements.profitOrLoss);
  section('Statement of Financial Position — Assets', statements.financialPosition.assets);
  section('Statement of Financial Position — Liabilities', statements.financialPosition.liabilities);
  section('Statement of Financial Position — Equity', statements.financialPosition.equity);
  section('Cash Flow Statement', statements.cashFlow);
  section('Technical Account', statements.technicalAccount);
  lines.push('', row('ADJUSTED TRIAL BALANCE'));
  lines.push(row('Code', 'Account', 'Category', 'Debit', 'Credit'));
  tb.forEach(r => lines.push(row(r.accountCode, r.accountName, r.category, Math.round(r.debit), Math.round(r.credit))));
  downloadFile(lines.join('\n'), `financial-analysis-${stamp()}.csv`);
};

/** Printable management report — the browser print dialog saves as PDF. */
export const exportManagementReport = (params: {
  statements: StatementsBundle;
  tbTotals: { debit: number; credit: number };
  reportingCurrency: string;
  kpis: Array<[string, string]>;
}): boolean => {
  const { statements, tbTotals, reportingCurrency, kpis } = params;
  const w = window.open('', '_blank');
  if (!w) return false;

  const table = (title: string, body: StatementLine[]) => `
    <h2>${title}</h2>
    <table>${body.map(l => `
      <tr${l.emphasis ? ' style="font-weight:bold;background:#f6f8fa"' : ''}>
        <th>${l.label}</th>
        <td style="text-align:right">${l.amount < 0 ? `(${money(Math.abs(l.amount))})` : money(l.amount)}</td>
      </tr>`).join('')}
    </table>`;

  w.document.write(`<!DOCTYPE html><html><head><title>Finance Management Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
      h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 22px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
      th { background: #f0f2f5; width: 65%; font-weight: normal; }
      .meta { color: #555; font-size: 12px; }
    </style></head><body>
    <h1>AfriReVision — Finance Management Report</h1>
    <p class="meta">Reporting currency ${reportingCurrency} · Generated ${new Date().toLocaleString()}</p>
    <h2>Key Indicators</h2>
    <table>${kpis.map(([k, v]) => `<tr><th>${k}</th><td style="text-align:right">${v}</td></tr>`).join('')}</table>
    ${table('Statement of Profit or Loss', statements.profitOrLoss)}
    ${table('Statement of Financial Position — Assets', statements.financialPosition.assets)}
    ${table('Statement of Financial Position — Liabilities & Equity',
      [...statements.financialPosition.liabilities, ...statements.financialPosition.equity])}
    ${table('Cash Flow Statement', statements.cashFlow)}
    ${table('Technical Account', statements.technicalAccount)}
    <h2>Trial Balance Control</h2>
    <table>
      <tr><th>Total debits</th><td style="text-align:right">${money(tbTotals.debit)}</td></tr>
      <tr><th>Total credits</th><td style="text-align:right">${money(tbTotals.credit)}</td></tr>
      <tr style="font-weight:bold"><th>Difference</th><td style="text-align:right">${money(tbTotals.debit - tbTotals.credit)}</td></tr>
    </table>
    <script>window.onload = () => window.print();</script>
    </body></html>`);
  w.document.close();
  return true;
};
