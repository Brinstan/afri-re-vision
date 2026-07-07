// Retrocession reporting: CSV registers and a print-to-PDF executive/board report.

import type { RetroClaim, RetroProgramme, Retrocessionaire } from '@/components/DataStore';
import { downloadFile } from '@/lib/actuarial';
import { ProgrammeProfitability } from './analytics';
import { ClaimRecovery, CounterpartyMetrics, LayerMetrics } from './types';

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const row = (...cells: Array<string | number>) => cells.map(esc).join(',');
const money = (n: number) => Math.round(n).toLocaleString();
const stamp = () => new Date().toISOString().split('T')[0];

export const exportProgrammeSummaryCsv = (programmes: RetroProgramme[], profitability: ProgrammeProfitability[]) => {
  const lines = [
    row('Code', 'Name', 'Type', 'Period', 'Currency', 'Territory', 'Broker', 'Status', 'Capacity', 'Retro Premium', 'Commission', 'Expected Recoveries', 'Net Cost', 'Utilization %'),
    ...programmes.map(p => {
      const prof = profitability.find(x => x.programmeId === p.id);
      return row(
        p.programmeCode, p.programmeName, p.type, `${p.effectiveDate} to ${p.expiryDate}`, p.currency,
        p.territory, p.retroBroker, p.status,
        Math.round(prof?.capacity ?? 0), Math.round(prof?.retroPremium ?? 0), Math.round(prof?.commissionIncome ?? 0),
        Math.round(prof?.expectedRecoveries ?? 0), Math.round(prof?.netCost ?? 0), (prof?.utilizationPct ?? 0).toFixed(1)
      );
    })
  ];
  downloadFile(lines.join('\n'), `retro-programme-summary-${stamp()}.csv`);
};

export const exportRecoveryRegisterCsv = (recoveries: ClaimRecovery[]) => {
  const lines = [
    row('Claim', 'Treaty', 'Programme', 'Layer', 'Gross Loss', 'Retention', 'Recoverable', 'Expected', 'Paid', 'Outstanding', 'Reserve', 'Net Retained', 'Currency'),
    ...recoveries.map(r => row(
      r.claimNumber, r.treatyName, r.programmeCode, r.layerName,
      Math.round(r.grossLoss), Math.round(r.retention), Math.round(r.recoverableAmount),
      Math.round(r.expectedRecovery), Math.round(r.paidRecovery), Math.round(r.outstandingRecovery),
      Math.round(r.recoveryReserve), Math.round(r.netRetainedLoss), r.currency
    ))
  ];
  downloadFile(lines.join('\n'), `recovery-register-${stamp()}.csv`);
};

export const exportRetroClaimsRegisterCsv = (retroClaims: RetroClaim[], programmes: RetroProgramme[]) => {
  const lines = [
    row('Retro Claim', 'Original Claim', 'Programme', 'Layer', 'Notified', 'Expected', 'Settled', 'Settlement Date', 'Status', 'Notes'),
    ...retroClaims.map(rc => {
      const programme = programmes.find(p => p.id === rc.programmeId);
      const layer = programme?.layers.find(l => l.id === rc.layerId);
      return row(
        rc.id, rc.originalClaimId, programme?.programmeCode ?? rc.programmeId, layer?.name ?? rc.layerId,
        rc.notificationDate, Math.round(rc.expectedRecovery), Math.round(rc.settledRecovery),
        rc.settlementDate ?? '', rc.status, rc.notes ?? ''
      );
    })
  ];
  downloadFile(lines.join('\n'), `retro-claims-register-${stamp()}.csv`);
};

export const exportCounterpartyCsv = (metrics: CounterpartyMetrics[]) => {
  const lines = [
    row('Retrocessionaire', 'Country', 'Rating', 'Strength', 'Capacity Offered', 'Capacity Used', 'Exposure', 'Outstanding', 'Paid', 'Concentration %', 'Programmes'),
    ...metrics.map(m => row(
      m.name, m.country, m.creditRating, m.financialStrength,
      Math.round(m.capacityOffered), Math.round(m.capacityUsed), Math.round(m.exposure),
      Math.round(m.outstandingRecoveries), Math.round(m.paidRecoveries),
      m.concentrationPct.toFixed(1), m.programmes.join('; ')
    ))
  ];
  downloadFile(lines.join('\n'), `counterparty-report-${stamp()}.csv`);
};

export const exportCapacityCsv = (metrics: LayerMetrics[]) => {
  const lines = [
    row('Programme', 'Layer', 'Attachment', 'Exhaustion', 'Width', 'Consumed', 'Remaining', 'Utilization %', 'Signed Lines %'),
    ...metrics.map(m => row(
      m.programmeCode, m.layerName, Math.round(m.attachmentPoint), Math.round(m.exhaustionPoint),
      Math.round(m.layerWidth), Math.round(m.consumed), Math.round(m.remainingCapacity),
      m.utilizationPct.toFixed(1), m.placementTotalPct.toFixed(1)
    ))
  ];
  downloadFile(lines.join('\n'), `capacity-utilization-${stamp()}.csv`);
};

/** Executive/board report — print dialog saves as PDF. */
export const exportExecutiveReport = (params: {
  profitability: ProgrammeProfitability[];
  counterparties: CounterpartyMetrics[];
  protection: { grossClaims: number; expectedRecoveries: number; netClaims: number; protectionPct: number };
  totals: { expected: number; paid: number; outstanding: number; reserve: number };
  retrocessionaires: Retrocessionaire[];
}): boolean => {
  const { profitability, counterparties, protection, totals } = params;
  const w = window.open('', '_blank');
  if (!w) return false;

  w.document.write(`<!DOCTYPE html><html><head><title>Retrocession Executive Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
      h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 22px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
      th { background: #f0f2f5; }
      .num { text-align: right; }
      .meta { color: #555; font-size: 12px; }
    </style></head><body>
    <h1>AfriReVision — Retrocession Executive & Board Report</h1>
    <p class="meta">Generated ${new Date().toLocaleString()}</p>

    <h2>Portfolio Protection</h2>
    <table>
      <tr><th>Gross claims incurred</th><td class="num">${money(protection.grossClaims)}</td></tr>
      <tr><th>Expected retro recoveries</th><td class="num">${money(protection.expectedRecoveries)}</td></tr>
      <tr><th>Net retained claims</th><td class="num">${money(protection.netClaims)}</td></tr>
      <tr><th>Protection ratio</th><td class="num">${protection.protectionPct.toFixed(1)}%</td></tr>
      <tr><th>Outstanding recoveries / reserve</th><td class="num">${money(totals.outstanding)} / ${money(totals.reserve)}</td></tr>
    </table>

    <h2>Programme Profitability</h2>
    <table>
      <tr><th>Programme</th><th class="num">Premium</th><th class="num">Commission</th><th class="num">Expected Recoveries</th><th class="num">Net Cost</th><th class="num">Recovery Ratio</th><th class="num">Utilization</th></tr>
      ${profitability.map(p => `
        <tr><td>${p.programmeCode} — ${p.programmeName}</td>
        <td class="num">${money(p.retroPremium)}</td>
        <td class="num">${money(p.commissionIncome)}</td>
        <td class="num">${money(p.expectedRecoveries)}</td>
        <td class="num">${money(p.netCost)}</td>
        <td class="num">${p.recoveryRatio === null ? '—' : p.recoveryRatio.toFixed(1) + '%'}</td>
        <td class="num">${p.utilizationPct.toFixed(1)}%</td></tr>`).join('')}
    </table>

    <h2>Counterparty Security</h2>
    <table>
      <tr><th>Retrocessionaire</th><th>Rating</th><th class="num">Capacity Used</th><th class="num">Exposure</th><th class="num">Outstanding</th><th class="num">Concentration</th></tr>
      ${counterparties.map(m => `
        <tr><td>${m.name} (${m.country})</td><td>${m.creditRating}</td>
        <td class="num">${money(m.capacityUsed)}</td>
        <td class="num">${money(m.exposure)}</td>
        <td class="num">${money(m.outstandingRecoveries)}</td>
        <td class="num">${m.concentrationPct.toFixed(1)}%</td></tr>`).join('')}
    </table>

    <script>window.onload = () => window.print();</script>
    </body></html>`);
  w.document.close();
  return true;
};
