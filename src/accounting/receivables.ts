// Receivables management: premium/broker/cedant receivables with aging and
// collection status derived from premium bookings.

import type { Treaty } from '@/components/DataStore';
import { AgingBucket, ReceivableRow } from './types';

const DAY = 24 * 60 * 60 * 1000;

const daysSince = (dateStr: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY));

export const agingBucketFor = (days: number | null): string => {
  if (days === null) return 'Settled';
  if (days <= 30) return 'Current';
  if (days <= 60) return '31–60 days';
  if (days <= 90) return '61–90 days';
  return '90+ days';
};

const collectionStatusFor = (outstanding: number, days: number | null): ReceivableRow['collectionStatus'] => {
  if (outstanding <= 0) return 'Settled';
  if (days === null || days <= 30) return 'Current';
  if (days <= 90) return 'Follow-up';
  return 'Overdue';
};

/** Premium receivables per treaty, with aging on the oldest unpaid booking. */
export const premiumReceivables = (treaties: Treaty[]): ReceivableRow[] =>
  treaties.map(treaty => {
    const bookings = treaty.premiumBookings ?? [];
    const totalBooked = bookings.reduce((s, b) => s + b.amount, 0);
    const totalPaid = bookings.reduce((s, b) => s + (b.paidAmount ?? 0), 0);
    const outstanding = totalBooked - totalPaid;
    const unpaidDates = bookings.filter(b => b.status !== 'Paid').map(b => b.date).sort();
    const oldestDueDate = outstanding > 0 && unpaidDates.length > 0 ? unpaidDates[0] : null;
    const daysOutstanding = oldestDueDate ? daysSince(oldestDueDate) : null;
    return {
      key: treaty.treatyName,
      reference: treaty.contractNumber,
      type: 'Premium' as const,
      currency: treaty.currency,
      totalBooked,
      totalPaid,
      outstanding,
      oldestDueDate,
      daysOutstanding,
      agingBucket: agingBucketFor(outstanding > 0 ? daysOutstanding : null),
      collectionStatus: collectionStatusFor(outstanding, daysOutstanding)
    };
  });

/** Outstanding balances grouped by broker / cedant (counterparty view). */
export const counterpartyReceivables = (treaties: Treaty[], by: 'broker' | 'cedant'): ReceivableRow[] => {
  const groups = new Map<string, { booked: number; paid: number; currency: string; oldest: string | null; refs: string[] }>();
  treaties.forEach(t => {
    const key = by === 'broker' ? t.broker : t.cedant;
    const bookings = t.premiumBookings ?? [];
    const booked = bookings.reduce((s, b) => s + b.amount, 0);
    const paid = bookings.reduce((s, b) => s + (b.paidAmount ?? 0), 0);
    const unpaidDates = bookings.filter(b => b.status !== 'Paid').map(b => b.date).sort();
    const g = groups.get(key) ?? { booked: 0, paid: 0, currency: t.currency, oldest: null, refs: [] };
    g.booked += booked;
    g.paid += paid;
    g.refs.push(t.contractNumber);
    if (unpaidDates.length > 0 && (!g.oldest || unpaidDates[0] < g.oldest)) g.oldest = unpaidDates[0];
    groups.set(key, g);
  });
  return Array.from(groups.entries()).map(([key, g]) => {
    const outstanding = g.booked - g.paid;
    const days = outstanding > 0 && g.oldest ? daysSince(g.oldest) : null;
    return {
      key,
      reference: g.refs.join(', '),
      type: (by === 'broker' ? 'Broker' : 'Cedant') as ReceivableRow['type'],
      currency: g.currency,
      totalBooked: g.booked,
      totalPaid: g.paid,
      outstanding,
      oldestDueDate: g.oldest,
      daysOutstanding: days,
      agingBucket: agingBucketFor(outstanding > 0 ? days : null),
      collectionStatus: collectionStatusFor(outstanding, days)
    };
  }).sort((a, b) => b.outstanding - a.outstanding);
};

/** Aging distribution of the outstanding balance across standard buckets. */
export const agingAnalysis = (rows: ReceivableRow[]): AgingBucket[] => {
  const buckets = ['Current', '31–60 days', '61–90 days', '90+ days'];
  return buckets.map(label => ({
    label,
    amount: rows.filter(r => r.agingBucket === label).reduce((s, r) => s + r.outstanding, 0)
  }));
};

/** Payment history rows (receipts) across all treaties. */
export const paymentHistory = (treaties: Treaty[]) =>
  treaties.flatMap(t =>
    (t.premiumBookings ?? [])
      .filter(b => (b.paidAmount ?? 0) > 0)
      .map(b => ({
        date: b.date,
        treatyName: t.treatyName,
        contractNumber: t.contractNumber,
        type: b.type,
        currency: t.currency,
        amount: b.paidAmount ?? 0,
        status: b.status
      }))
  ).sort((a, b) => b.date.localeCompare(a.date));
