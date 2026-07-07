// Automatic journal generation.
//
// Journals are DERIVED deterministically from operational data (treaties,
// premium bookings, claims, investments) plus IFRS/actuarial adjustments and
// user-captured manual journals. Because derivation is a pure function of the
// store, every operational action anywhere in the app automatically produces
// the corresponding accounting entries — no module needs to post explicitly.

import type { Claim, Investment, ManualJournal, RetroClaim, RetroProgramme, Treaty } from '@/components/DataStore';
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
  totalIbnr: number,
  retroProgrammes: RetroProgramme[] = [],
  retroClaims: RetroClaim[] = []
): Journal[] => {
  const journals: Journal[] = [];
  // When retro programmes exist they are the source of truth for outward
  // premium — the per-treaty retroPercentage journal is skipped to avoid
  // double-counting the cession.
  const useProgrammeRetro = retroProgrammes.length > 0;

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

    // 4) Retrocession premium ceded (legacy per-treaty basis, only when no
    //    retro programmes are defined)
    const retroPremium = treaty.premium * treaty.retroPercentage / 100;
    if (retroPremium > 0 && !useProgrammeRetro) {
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

  // 10) Retro programme premiums and override commission (per layer)
  retroProgrammes.forEach(programme => {
    programme.layers.forEach(layer => {
      if (layer.premium > 0) {
        journals.push(journal(
          `JN-RPP-${layer.id}`, programme.effectiveDate, programme.programmeCode, programme.currency,
          [line('5200', layer.premium, 0), line('2200', 0, layer.premium)],
          'Retrocession Premium',
          `Retro premium — ${programme.programmeName} / ${layer.name}`
        ));
      }
    });
    const totalPremium = programme.layers.reduce((s, l) => s + l.premium, 0);
    const commission = totalPremium * programme.commissionPct / 100;
    if (commission > 0) {
      journals.push(journal(
        `JN-RPC-${programme.id}`, programme.effectiveDate, programme.programmeCode, programme.currency,
        [line('2200', commission, 0), line('4110', 0, commission)],
        'Retrocession Premium',
        `Override commission ${programme.commissionPct}% — ${programme.programmeName}`
      ));
    }
  });

  // 11) Settled retro recoveries: cash received against the recoverable
  retroClaims.filter(rc => rc.status === 'Settled' && rc.settledRecovery > 0).forEach(rc => {
    const programme = retroProgrammes.find(p => p.id === rc.programmeId);
    journals.push(journal(
      `JN-RS-${rc.id}`, rc.settlementDate ?? rc.notificationDate, rc.id, programme?.currency ?? 'USD',
      [line('1010', rc.settledRecovery, 0), line('1200', 0, rc.settledRecovery)],
      'Retrocession Recovery',
      `Retro recovery settled — ${programme?.programmeCode ?? rc.programmeId}`
    ));
  });

  // 12) IFRS/actuarial adjustment: IBNR provision (adjusted TB only)
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
  totalIbnr: number,
  retroProgrammes: RetroProgramme[] = [],
  retroClaims: RetroClaim[] = []
): Journal[] =>
  [...deriveJournals(treaties, claims, investments, totalIbnr, retroProgrammes, retroClaims), ...manualJournals.map(manualToJournal)]
    .sort((a, b) => a.postingDate.localeCompare(b.postingDate));
