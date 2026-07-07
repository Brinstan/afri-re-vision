// Export helpers for the IFRS 17 workstation: CSV summaries, Excel-compatible
// analysis files, and a printable (print-to-PDF) management report.

import { downloadFile } from '@/lib/actuarial';
import {
  FinancialStatements, FulfilmentCashFlows, Ifrs17Assumptions,
  LicRollForward, LrcRollForward, PortfolioPerformanceRow,
  ReinsuranceHeld, ReinsuranceIssued
} from './types';
import { riskAdjustmentMethodLabel } from './riskAdjustment';

const csvEscape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const row = (...cells: Array<string | number>) => cells.map(csvEscape).join(',');
const money = (n: number) => Math.round(n).toLocaleString();

export const exportLrcCsv = (rows: LrcRollForward[]) => {
  const lines = [
    row('Treaty', 'Model', 'Opening', 'Premium Received', 'Revenue Recognized', 'Acquisition CF', 'Loss Component', 'CSM', 'Closing'),
    ...rows.map(r => row(r.treatyName, r.model, Math.round(r.openingBalance), Math.round(r.premiumReceived),
      Math.round(r.revenueRecognized), Math.round(r.acquisitionCashFlows), Math.round(r.lossComponent),
      Math.round(r.csm), Math.round(r.closingBalance)))
  ];
  downloadFile(lines.join('\n'), `ifrs17-lrc-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportLicCsv = (rows: LicRollForward[]) => {
  const lines = [
    row('Treaty', 'Opening', 'Claims Incurred', 'Claims Paid', 'IBNR', 'Risk Adjustment', 'Closing'),
    ...rows.map(r => row(r.treatyName, Math.round(r.openingBalance), Math.round(r.claimsIncurred),
      Math.round(r.claimsPaid), Math.round(r.ibnrMovement), Math.round(r.riskAdjustment), Math.round(r.closingBalance)))
  ];
  downloadFile(lines.join('\n'), `ifrs17-lic-${new Date().toISOString().split('T')[0]}.csv`);
};

/** Excel-compatible analysis workbook (single-sheet CSV Excel opens directly). */
export const exportAnalysisExcel = (
  lrc: LrcRollForward[],
  lic: LicRollForward[],
  performance: PortfolioPerformanceRow[],
  statements: FinancialStatements
) => {
  const lines: string[] = [];
  lines.push(row('AFRIREVISION IFRS 17 ANALYSIS'), '');
  lines.push(row('FINANCIAL STATEMENTS'));
  lines.push(row('Insurance Revenue', Math.round(statements.insuranceRevenue)));
  lines.push(row('Insurance Service Expenses', Math.round(statements.insuranceServiceExpenses)));
  lines.push(row('Insurance Service Result', Math.round(statements.insuranceServiceResult)));
  lines.push(row('Insurance Finance Expense', Math.round(statements.insuranceFinanceExpense)));
  lines.push(row('Reinsurance Held Result', Math.round(statements.reinsuranceHeldResult)));
  lines.push(row('Technical Result', Math.round(statements.technicalResult)), '');
  lines.push(row('LRC ROLL-FORWARD'));
  lines.push(row('Treaty', 'Model', 'Premium Received', 'Revenue', 'Closing'));
  lrc.forEach(r => lines.push(row(r.treatyName, r.model, Math.round(r.premiumReceived), Math.round(r.revenueRecognized), Math.round(r.closingBalance))));
  lines.push('', row('LIC ROLL-FORWARD'));
  lines.push(row('Treaty', 'Incurred', 'Paid', 'IBNR', 'RA', 'Closing'));
  lic.forEach(r => lines.push(row(r.treatyName, Math.round(r.claimsIncurred), Math.round(r.claimsPaid), Math.round(r.ibnrMovement), Math.round(r.riskAdjustment), Math.round(r.closingBalance))));
  lines.push('', row('PORTFOLIO PERFORMANCE'));
  lines.push(row('Group', 'Premium', 'Revenue', 'Claims', 'Expenses', 'Result', 'Loss Ratio %'));
  performance.forEach(p => lines.push(row(p.key, Math.round(p.premium), Math.round(p.revenue), Math.round(p.claimsIncurred), Math.round(p.expenses), Math.round(p.result), p.lossRatio === null ? '' : p.lossRatio.toFixed(1))));
  downloadFile(lines.join('\n'), `ifrs17-analysis-${new Date().toISOString().split('T')[0]}.csv`);
};

/** Printable management report — the browser print dialog saves it as PDF. */
export const exportManagementReportPdf = (params: {
  assumptions: Ifrs17Assumptions;
  statements: FinancialStatements;
  fcf: FulfilmentCashFlows;
  issued: ReinsuranceIssued;
  held: ReinsuranceHeld;
  lrcTotal: { closingBalance: number; premiumReceived: number; revenueRecognized: number };
  licTotal: { closingBalance: number; ibnrMovement: number; riskAdjustment: number };
  scopeDescription: string;
  actuarialMethodLabel: string;
}): boolean => {
  const { assumptions, statements, fcf, issued, held, lrcTotal, licTotal, scopeDescription, actuarialMethodLabel } = params;
  const w = window.open('', '_blank');
  if (!w) return false;

  const tr = (label: string, value: string) => `<tr><th>${label}</th><td style="text-align:right">${value}</td></tr>`;
  w.document.write(`<!DOCTYPE html><html><head><title>IFRS 17 Management Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
      h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 22px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
      th { background: #f0f2f5; width: 60%; }
      .meta { color: #555; font-size: 12px; }
    </style></head><body>
    <h1>AfriReVision — IFRS 17 Management Report</h1>
    <p class="meta">Valuation date ${assumptions.valuationDate} · Currency ${assumptions.reportingCurrency} · Scope: ${scopeDescription} · Generated ${new Date().toLocaleString()}</p>
    <h2>Statement of Insurance Service Result</h2>
    <table>
      ${tr('Insurance revenue', money(statements.insuranceRevenue))}
      ${tr('Insurance service expenses', `(${money(statements.insuranceServiceExpenses)})`)}
      ${tr('Insurance service result', money(statements.insuranceServiceResult))}
      ${tr('Insurance finance expense', `(${money(statements.insuranceFinanceExpense)})`)}
      ${tr('Net result from reinsurance held', money(statements.reinsuranceHeldResult))}
      ${tr('Technical result', money(statements.technicalResult))}
    </table>
    <h2>Balance Sheet Positions</h2>
    <table>
      ${tr('Liability for Remaining Coverage (LRC)', money(lrcTotal.closingBalance))}
      ${tr('Liability for Incurred Claims (LIC)', money(licTotal.closingBalance))}
      ${tr('of which IBNR', money(licTotal.ibnrMovement))}
      ${tr('of which Risk Adjustment', money(licTotal.riskAdjustment))}
    </table>
    <h2>Fulfilment Cash Flows</h2>
    <table>
      ${tr('Expected claims', money(fcf.expectedClaims))}
      ${tr('Expected expenses', money(fcf.expectedExpenses))}
      ${tr('Reinsurance recoveries', `(${money(fcf.reinsuranceRecoveries)})`)}
      ${tr('Effect of discounting', `(${money(fcf.discountEffect)})`)}
      ${tr('Risk adjustment', money(fcf.riskAdjustment))}
      ${tr('Total fulfilment cash flows', money(fcf.totalFcf))}
    </table>
    <h2>Reinsurance Issued / Held</h2>
    <table>
      ${tr('Written premium (issued)', money(issued.premium))}
      ${tr('Insurance revenue (issued)', money(issued.revenue))}
      ${tr('Claims incurred (issued)', money(issued.claimsIncurred))}
      ${tr('Ceded premium (held)', money(held.cededPremium))}
      ${tr('Recoveries (held)', money(held.recoveries))}
    </table>
    <h2>Basis of Preparation</h2>
    <table>
      ${tr('Discount rate', `${assumptions.discountRate}% p.a. (simplified single-period)`)}
      ${tr('Risk adjustment', riskAdjustmentMethodLabel(assumptions))}
      ${tr('Attributable expense ratio', `${assumptions.expenseRatio}% of premium`)}
      ${tr('IBNR source', `Actuarial engine — ${actuarialMethodLabel}`)}
      ${tr('Measurement models', 'PAA where coverage ≤ 12 months, otherwise GMM; user overrides per treaty')}
    </table>
    <script>window.onload = () => window.print();</script>
    </body></html>`);
  w.document.close();
  return true;
};
