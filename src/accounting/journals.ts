// Automatic journal generation.
//
// Journals are DERIVED deterministically from operational data (treaties,
// premium bookings, claims, investments) plus IFRS/actuarial adjustments and
// user-captured manual journals. Because derivation is a pure function of the
// store, every operational action anywhere in the app automatically produces
// the corresponding accounting entries — no module needs to post explicitly.

import type { Claim, Investment, ManualJournal, Treaty } from '@/components/DataStore';
import { claimIncurred, claimPaid } from '@/lib/actuarial';
import { accountName } from './chartOfAccounts';
import { Journal, JournalLine } from './types';

const line = (accountCode: string, debit: number, credit: number): JournalLine => ({
  accountCode,
  accountName: accountName(accountCode),
  debit,
  credit
});

const journal = (
  journalNumber: string,
  postingDate: string,
  reference: string,
  currency: string,
  lines: JournalLine[],
  sourceModule: Journal['sourceModule'],
  narration: string,
  extra: Partial<Journal> = {}
): Journal => ({
  journalNumber,
  postingDate,
  reference,
  currency,
  lines,
  sourceModule,
  narration,
  status: 'Posted',
  postedBy: 'system (auto)',
  ...extra
});

/** All automatically generated journals from the operational data. */
export const deriveJournals = (
  treaties: Treaty[],
  claims: Claim[],
  investments: Investment[],
  totalIbnr: number
): Journal[] => {
  const journals: Journal[] = [];

  treaties.forEach(treaty => {
    (treaty.premiumBookings ?? []).forEach(booking => {
      const isReinstatement = booking.type.startsWith('Reinstatement');
      const isClaimPayment = booking.type.startsWith('Claim Payment');
      if (isClaimPayment) return; // claim settlements are journalised from the claim itself

      const revenueAccount = isReinstatement ? '4010' : '4000';

      // 1) Booking: premium receivable vs written premium
      journals.push(journal(
        `JN-PB-${booking.id}`, booking.date, booking.id, treaty.currency,
        [line('1100', booking.amount, 0), line(revenueAccount, 0, booking.amount)],
        isReinstatement ? 'Reinstatement Premium' : 'Premium Booking',
        `${booking.type} premium booked — ${treaty.treatyName}`,
        { treatyReference: treaty.contractNumber }
      ));

      // 2) Receipt: cash vs receivable (for the paid portion)
      const paid = booking.paidAmount ?? 0;
      if (paid > 0) {
        journals.push(journal(
          `JN-PR-${booking.id}`, booking.date, booking.id, treaty.currency,
          [line('1010', paid, 0), line('1100', 0, paid)],
          'Premium Receipt',
          `Premium received on ${booking.type} — ${treaty.treatyName}`,
          { treatyReference: treaty.contractNumber }
        ));
      }
    });

    // 3) Broker commission accrual on written premium
    const commission = treaty.premium * treaty.commission / 100;
    if (commission > 0) {
      journals.push(journal(
        `JN-BC-${treaty.id}`, treaty.inceptionDate, treaty.contractNumber, treaty.currency,
        [line('5100', commission, 0), line('2100', 0, commission)],
        'Broker Commission',
        `Commission accrual ${treaty.commission}% — ${treaty.broker} on ${treaty.treatyName}`,
        { treatyReference: treaty.contractNumber }
      ));
    }

    // 4) Retrocession premium ceded
    const retroPremium = treaty.premium * treaty.retroPercentage / 100;
    if (retroPremium > 0) {
      journals.push(journal(
        `JN-RP-${treaty.id}`, treaty.inceptionDate, treaty.contractNumber, treaty.currency,
        [line('5200', retroPremium, 0), line('2200', 0, retroPremium)],
        'Retrocession Premium',
        `Retro cession ${treaty.retroPercentage}% of premium — ${treaty.treatyName}`,
        { treatyReference: treaty.contractNumber }
      ));
    }
  });

  claims.forEach(claim => {
    const incurred = claimIncurred(claim);
    const paid = claimPaid(claim);

    // 5) Claim registration: claims expense vs outstanding claims reserve
    if (incurred > 0) {
      journals.push(journal(
        `JN-CR-${claim.id}`, claim.dateReported, claim.claimNumber, claim.currency,
        [line('5000', incurred, 0), line('2000', 0, incurred)],
        'Claim Registration',
        `Claim incurred — ${claim.claimNumber} (${claim.insuredName})`,
        { treatyReference: claim.contractNumber, claimReference: claim.claimNumber }
      ));
    }

    // 6) Claim payment: reserve released vs cash
    if (paid > 0) {
      journals.push(journal(
        `JN-CP-${claim.id}`, claim.paymentDate ?? claim.dateApproved ?? claim.dateReported,
        claim.paymentReference ?? claim.claimNumber, claim.currency,
        [line('2000', paid, 0), line('1010', 0, paid)],
        'Claim Payment',
        `Claim settlement — ${claim.claimNumber}`,
        { treatyReference: claim.contractNumber, claimReference: claim.claimNumber }
      ));
    }

    // 7) Retro recovery on the claim
    const recovery = claim.retroRecovery ?? 0;
    if (recovery > 0) {
      journals.push(journal(
        `JN-RR-${claim.id}`, claim.dateReported, claim.claimNumber, claim.currency,
        [line('1200', recovery, 0), line('4100', 0, recovery)],
        'Retrocession Recovery',
        `Retro recovery accrued — ${claim.claimNumber}`,
        { treatyReference: claim.contractNumber, claimReference: claim.claimNumber }
      ));
    }
  });

  investments.forEach(inv => {
    // 8) Investment purchase: investment asset vs cash
    const assetAccount = inv.investmentType === 'Bonds' || inv.entityType === 'Government' ? '1310' : '1320';
    journals.push(journal(
      `JN-IP-${inv.id}`, inv.investmentDate, inv.id, inv.currency,
      [line(assetAccount, inv.amount, 0), line('1010', 0, inv.amount)],
      'Investment Purchase',
      `Investment placed — ${inv.investmentEntity}`
    ));

    // 9) Investment income realised to date
    if (inv.actualReturns > 0) {
      journals.push(journal(
        `JN-II-${inv.id}`, inv.investmentDate, inv.id, inv.currency,
        [line('1010', inv.actualReturns, 0), line('4200', 0, inv.actualReturns)],
        'Investment Income',
        `Realised returns — ${inv.investmentEntity}`
      ));
    }
  });

  // 10) IFRS/actuarial adjustment: IBNR provision (adjusted TB only)
  if (totalIbnr > 0) {
    journals.push(journal(
      `JN-IBNR`, new Date().toISOString().split('T')[0], 'ACTUARIAL-IBNR', 'USD',
      [line('5010', totalIbnr, 0), line('2010', 0, totalIbnr)],
      'IFRS Adjustment',
      'IBNR provision from the Actuarial Engine (selected reserving method)',
      { status: 'Adjustment' }
    ));
  }

  return journals.sort((a, b) => a.postingDate.localeCompare(b.postingDate));
};

export const manualToJournal = (m: ManualJournal): Journal => ({
  journalNumber: m.id,
  postingDate: m.postingDate,
  reference: m.reference,
  currency: m.currency,
  lines: [line(m.debitAccount, m.amount, 0), line(m.creditAccount, 0, m.amount)],
  sourceModule: 'Manual',
  status: m.adjustment ? 'Adjustment' : 'Posted',
  postedBy: m.postedBy,
  narration: m.narration
});

export const allJournals = (
  treaties: Treaty[],
  claims: Claim[],
  investments: Investment[],
  manualJournals: ManualJournal[],
  totalIbnr: number
): Journal[] =>
  [...deriveJournals(treaties, claims, investments, totalIbnr), ...manualJournals.map(manualToJournal)]
    .sort((a, b) => a.postingDate.localeCompare(b.postingDate));
