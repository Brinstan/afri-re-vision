// Pricing report exports: CSV of the full pricing exercise and a print-to-PDF
// pricing memo.

import { downloadFile } from '@/lib/actuarial';
import { PricingOutput } from './treatyPricing';
import { RateAdequacyRow } from './analytics';
import { PRICING_METHOD_LABELS, PricingAssumptions, PricingScenario, PricingStructure, PricingValidationIssue } from './types';

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const row = (...cells: Array<string | number>) => cells.map(esc).join(',');
const money = (n: number) => Math.round(n).toLocaleString();
const stamp = () => new Date().toISOString().split('T')[0];

export const exportPricingCsv = (structure: PricingStructure, output: PricingOutput) => {
  const lines: string[] = [];
  lines.push(row('AFRIREVISION PRICING EXERCISE'), row(`${structure.treatyType} — ${structure.linesOfBusiness.join('; ')}`), '');
  lines.push(row('EXPERIENCE (TRENDED)'));
  lines.push(row('Year', 'Premium', 'Gross Losses', 'Losses in Structure', 'Claims', 'Loss Ratio %'));
  output.experience.forEach(e => lines.push(row(e.year, Math.round(e.premium), Math.round(e.losses), Math.round(e.lossesInStructure), e.claimCount, e.lossRatioPct?.toFixed(1) ?? '')));
  lines.push('', row('METHOD RESULTS'));
  lines.push(row('Method', 'Loss Cost', 'Rate %', 'Usable', 'Basis'));
  output.methods.forEach(m => lines.push(row(PRICING_METHOD_LABELS[m.method], Math.round(m.lossCost), m.lossCostRatePct?.toFixed(2) ?? '', m.usable ? 'Yes' : 'No', m.note)));
  lines.push('', row('PREMIUM BUILD-UP'));
  const b = output.buildUp;
  [['Expected loss cost (credibility blend)', b.expectedLossCost], ['Risk loading', b.riskLoading],
   ['Technical premium', b.technicalPremium], ['Expense loading', b.expenseLoading],
   ['Commission loading', b.commissionLoading], ['Profit loading', b.profitLoading],
   ['OFFICE PREMIUM', b.officePremium]].forEach(([label, v]) => lines.push(row(label as string, Math.round(v as number))));
  downloadFile(lines.join('\n'), `pricing-${structure.treatyType.toLowerCase().replace(/\s/g, '-')}-${stamp()}.csv`);
};

export const exportPricingMemoPdf = (params: {
  structure: PricingStructure;
  assumptions: PricingAssumptions;
  output: PricingOutput;
  scenarios: PricingScenario[];
  issues: PricingValidationIssue[];
  adequacy: RateAdequacyRow[];
}): boolean => {
  const { structure, assumptions, output, scenarios, issues, adequacy } = params;
  const w = window.open('', '_blank');
  if (!w) return false;
  const b = output.buildUp;

  w.document.write(`<!DOCTYPE html><html><head><title>Pricing Memo</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
      h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 22px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
      th { background: #f0f2f5; }
      .num { text-align: right; } .bold { font-weight: bold; background: #f6f8fa; }
    </style></head><body>
    <h1>AfriReVision — Pricing Memo</h1>
    <p style="color:#555;font-size:12px">${structure.treatyType} · ${structure.linesOfBusiness.join(', ') || 'linked treaty'} · subject premium ${structure.currency} ${money(structure.subjectPremium)} · generated ${new Date().toLocaleString()}</p>

    <h2>Recommended Premium</h2>
    <table>
      <tr><th>Expected loss cost — ${output.selectedBasis}</th><td class="num">${money(b.expectedLossCost)}</td></tr>
      <tr><th>Risk loading (${assumptions.riskLoadingPct}%)</th><td class="num">${money(b.riskLoading)}</td></tr>
      <tr class="bold"><th>Technical premium</th><td class="num">${money(b.technicalPremium)}</td></tr>
      <tr><th>Expense (${assumptions.expenseLoadingPct}%) / Commission (${assumptions.commissionLoadingPct}%) / Profit (${assumptions.profitLoadingPct}%)</th>
          <td class="num">${money(b.expenseLoading + b.commissionLoading + b.profitLoading)}</td></tr>
      <tr class="bold"><th>Office premium</th><td class="num">${money(b.officePremium)}</td></tr>
      <tr><th>Rate on subject premium</th><td class="num">${b.ratePct?.toFixed(2) ?? '—'}%</td></tr>
      ${b.rateOnLinePct !== null ? `<tr><th>Rate on line</th><td class="num">${b.rateOnLinePct.toFixed(2)}%</td></tr>` : ''}
    </table>

    <h2>Method Comparison</h2>
    <table>
      <tr><th>Method</th><th class="num">Loss Cost</th><th class="num">Rate %</th><th>Basis</th></tr>
      ${output.methods.map(m => `<tr><td>${PRICING_METHOD_LABELS[m.method]}${m.usable ? '' : ' (insufficient data)'}</td>
        <td class="num">${money(m.lossCost)}</td><td class="num">${m.lossCostRatePct?.toFixed(2) ?? '—'}</td><td>${m.note}</td></tr>`).join('')}
    </table>
    <p style="font-size:12px">${output.blend.note}</p>

    <h2>Scenario Analysis</h2>
    <table>
      <tr><th>Scenario</th><th class="num">Office Premium</th><th class="num">vs Base</th></tr>
      ${scenarios.map(s => `<tr><td>${s.name}</td><td class="num">${money(s.officePremium)}</td>
        <td class="num">${s.deltaVsBasePct === null ? '—' : (s.deltaVsBasePct >= 0 ? '+' : '') + s.deltaVsBasePct.toFixed(1) + '%'}</td></tr>`).join('')}
    </table>

    <h2>Validation</h2>
    <table>${issues.length === 0 ? '<tr><td>All pricing validations pass.</td></tr>'
      : issues.map(i => `<tr><td>${i.severity.toUpperCase()}</td><td>${i.message}</td></tr>`).join('')}</table>

    <h2>Portfolio Rate Adequacy</h2>
    <table>
      <tr><th>Line</th><th class="num">Booked</th><th class="num">Required</th><th class="num">Adequacy</th><th>Verdict</th></tr>
      ${adequacy.map(a => `<tr><td>${a.lineOfBusiness}</td><td class="num">${money(a.bookedPremium)}</td>
        <td class="num">${money(a.requiredPremium)}</td><td class="num">${a.adequacyPct?.toFixed(0) ?? '—'}%</td><td>${a.verdict}</td></tr>`).join('')}
    </table>

    <h2>Assumptions</h2>
    <table>
      <tr><th>Claims inflation / premium trend</th><td>${assumptions.claimsInflationPct}% / ${assumptions.premiumTrendPct}% p.a.</td></tr>
      <tr><th>Expected loss ratio prior</th><td>${assumptions.expectedLossRatioPct}%</td></tr>
      <tr><th>Full-credibility claim count</th><td>${assumptions.fullCredibilityClaims}</td></tr>
      <tr><th>Exposure curve exponent</th><td>${assumptions.exposureCurveExponent}</td></tr>
    </table>

    <script>window.onload = () => window.print();</script>
    </body></html>`);
  w.document.close();
  return true;
};
