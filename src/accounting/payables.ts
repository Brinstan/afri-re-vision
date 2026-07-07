// Payables management: claims, broker commission, retrocession, and supplier
// payables with outstanding analysis and a payment schedule.

import type { Claim, Treaty } from '@/components/DataStore';
import { claimIncurred, claimPaid } from '@/lib/actuarial';
import { PayableRow } from './types';

const DAY = 24 * 60 * 60 * 1000;

const addDays = (dateStr: string, days: number): string =>
  new Date(new Date(dateStr).getTime() + days * DAY).toISOString().split('T')[0];

const statusFor = (outstanding: number, paid: number): PayableRow['status'] =>
  outstanding <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Outstanding';

/** Claims payables: incurred less paid per claim, due 30 days after approval. */
export const claimsPayables = (claims: Claim[], treaties: Treaty[]): PayableRow[] =>
  claims.map(c => {
    const treaty = treaties.find(t => t.id === c.treatyId);
    const amount = claimIncurred(c);
    const paid = claimPaid(c);
    return {
      key: `${c.claimNumber} — ${c.insuredName}`,
      reference: treaty?.treatyName ?? c.contractNumber,
      type: 'Claims' as const,
      currency: c.currency,
      amount,
      paidAmount: paid,
      outstanding: Math.max(0, amount - paid),
      dueDate: addDays(c.dateApproved ?? c.dateReported, 30),
      status: statusFor(amount - paid, paid)
    };
  });

/** Broker commission payables per treaty (accrued on written premium). */
export const commissionPayables = (treaties: Treaty[]): PayableRow[] =>
  treaties
    .filter(t => t.commission > 0)
    .map(t => {
      const amount = t.premium * t.commission / 100;
      return {
        key: `${t.broker} — commission ${t.commission}%`,
        reference: t.treatyName,
        type: 'Commission' as const,
        currency: t.currency,
        amount,
        paidAmount: 0,
        outstanding: amount,
        dueDate: t.expiryDate,
        status: 'Outstanding' as const
      };
    });

/** Retrocession premium payables per treaty (ceded share of written premium). */
export const retroPayables = (treaties: Treaty[]): PayableRow[] =>
  treaties
    .filter(t => t.retroPercentage > 0)
    .map(t => {
      const amount = t.premium * t.retroPercentage / 100;
      return {
        key: `Retro cession ${t.retroPercentage}% — ${t.treatyName}`,
        reference: t.contractNumber,
        type: 'Retrocession' as const,
        currency: t.currency,
        amount,
        paidAmount: 0,
        outstanding: amount,
        dueDate: addDays(t.inceptionDate, 90),
        status: 'Outstanding' as const
      };
    });

/** Combined payment schedule ordered by due date. */
export const paymentSchedule = (rows: PayableRow[]): PayableRow[] =>
  rows.filter(r => r.outstanding > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
