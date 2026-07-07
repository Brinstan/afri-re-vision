// Liability for Remaining Coverage (LRC) roll-forward per treaty.
//
// PAA: LRC = premium received − revenue recognized (earned premium) − acquisition CF amortisation.
// GMM (simplified): fulfilment cash flows for remaining coverage + CSM; a
// negative day-one CSM becomes a loss component recognised immediately.

import type { Claim, Treaty } from '@/components/DataStore';
import { Ifrs17Assumptions, LrcRollForward } from './types';
import { earnedFraction, measurementModel, discountFactor } from './assumptions';
import { riskAdjustment } from './riskAdjustment';

const premiumReceived = (treaty: Treaty): number =>
  (treaty.premiumBookings ?? []).reduce((s, b) => s + (b.paidAmount ?? 0), 0);

export const lrcRollForward = (
  treaty: Treaty,
  _claims: Claim[],
  assumptions: Ifrs17Assumptions,
  expectedLossRatioPct: number
): LrcRollForward => {
  const model = measurementModel(treaty, assumptions);
  const earned = earnedFraction(treaty, assumptions.valuationDate);
  const received = premiumReceived(treaty);
  const written = treaty.premium;

  // Acquisition cash flows: broker commission amortised over coverage.
  const acquisitionTotal = written * treaty.commission / 100;
  const acquisitionAmortised = acquisitionTotal * earned;

  const revenueRecognized = written * earned;

  if (model === 'PAA') {
    return {
      treatyId: treaty.id,
      treatyName: treaty.treatyName,
      model,
      openingBalance: 0,
      premiumReceived: received,
      revenueRecognized,
      acquisitionCashFlows: acquisitionAmortised,
      lossComponent: 0,
      csm: 0,
      closingBalance: received - revenueRecognized - acquisitionAmortised,
      earnedFraction: earned
    };
  }

  // GMM / VFA (VFA treated as GMM placeholder): CSM measured at initial recognition.
  const unearned = 1 - earned;
  const expectedClaimsRemaining = written * unearned * expectedLossRatioPct / 100 * discountFactor(assumptions);
  const raRemaining = riskAdjustment(expectedClaimsRemaining, assumptions);
  const fcfRemaining = expectedClaimsRemaining + raRemaining + written * unearned * assumptions.expenseRatio / 100;

  const fcfAtInception = written * expectedLossRatioPct / 100 * discountFactor(assumptions)
    + riskAdjustment(written * expectedLossRatioPct / 100, assumptions)
    + written * assumptions.expenseRatio / 100
    + acquisitionTotal;
  const csmAtInception = written - fcfAtInception;
  const lossComponent = csmAtInception < 0 ? -csmAtInception : 0;
  const csmRemaining = Math.max(0, csmAtInception) * unearned; // released with coverage

  return {
    treatyId: treaty.id,
    treatyName: treaty.treatyName,
    model,
    openingBalance: 0,
    premiumReceived: received,
    revenueRecognized,
    acquisitionCashFlows: acquisitionAmortised,
    lossComponent,
    csm: csmRemaining,
    closingBalance: fcfRemaining + csmRemaining,
    earnedFraction: earned
  };
};

export const lrcTotals = (rows: LrcRollForward[]) =>
  rows.reduce(
    (acc, r) => ({
      openingBalance: acc.openingBalance + r.openingBalance,
      premiumReceived: acc.premiumReceived + r.premiumReceived,
      revenueRecognized: acc.revenueRecognized + r.revenueRecognized,
      acquisitionCashFlows: acc.acquisitionCashFlows + r.acquisitionCashFlows,
      lossComponent: acc.lossComponent + r.lossComponent,
      csm: acc.csm + r.csm,
      closingBalance: acc.closingBalance + r.closingBalance
    }),
    { openingBalance: 0, premiumReceived: 0, revenueRecognized: 0, acquisitionCashFlows: 0, lossComponent: 0, csm: 0, closingBalance: 0 }
  );
