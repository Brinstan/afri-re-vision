// Retrocession analytics: programme profitability, recovery ratios, exposure
// distribution, aging, and portfolio protection.

import type { Claim, RetroClaim, RetroProgramme, Treaty } from '@/components/DataStore';
import { claimIncurred } from '@/lib/actuarial';
import { programmeCapacity } from './capacityEngine';
import { ClaimRecovery, ExposureRow } from './types';

export interface ProgrammeProfitability {
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  retroPremium: number;             // Σ layer premiums
  commissionIncome: number;         // override commission received back
  expectedRecoveries: number;
  paidRecoveries: number;
  netCost: number;                  // premium − commission − recoveries
  recoveryRatio: number | null;     // recoveries / premium
  capacity: number;
  utilizationPct: number;
}

export const programmeProfitability = (
  programmes: RetroProgramme[],
  recoveries: ClaimRecovery[]
): ProgrammeProfitability[] =>
  programmes.map(p => {
    const retroPremium = p.layers.reduce((s, l) => s + l.premium, 0);
    const commissionIncome = retroPremium * p.commissionPct / 100;
    const rows = recoveries.filter(r => r.programmeId === p.id);
    const expected = rows.reduce((s, r) => s + r.expectedRecovery, 0);
    const paid = rows.reduce((s, r) => s + r.paidRecovery, 0);
    const capacity = programmeCapacity(p);
    return {
      programmeId: p.id,
      programmeCode: p.programmeCode,
      programmeName: p.programmeName,
      retroPremium,
      commissionIncome,
      expectedRecoveries: expected,
      paidRecoveries: paid,
      netCost: retroPremium - commissionIncome - expected,
      recoveryRatio: retroPremium > 0 ? (expected / retroPremium) * 100 : null,
      capacity,
      utilizationPct: capacity > 0 ? (expected / capacity) * 100 : 0
    };
  });

/** Gross vs net claims and portfolio protection headline. */
export const portfolioProtection = (claims: Claim[], recoveries: ClaimRecovery[]) => {
  const gross = claims.reduce((s, c) => s + claimIncurred(c), 0);
  const recovered = recoveries.reduce((s, r) => s + r.expectedRecovery, 0);
  return {
    grossClaims: gross,
    expectedRecoveries: recovered,
    netClaims: gross - recovered,
    protectionPct: gross > 0 ? (recovered / gross) * 100 : 0
  };
};

/** Exposure by an arbitrary treaty dimension: gross premium vs protected share. */
export const exposureBy = (
  treaties: Treaty[],
  recoveries: ClaimRecovery[],
  claims: Claim[],
  dimension: 'country' | 'cedant' | 'broker' | 'lineOfBusiness' | 'treaty'
): ExposureRow[] => {
  const groups = new Map<string, { gross: number; protectedAmt: number }>();
  const recoveriesByTreatyName = new Map<string, number>();
  recoveries.forEach(r => {
    recoveriesByTreatyName.set(r.treatyName, (recoveriesByTreatyName.get(r.treatyName) ?? 0) + r.expectedRecovery);
  });

  treaties.forEach(t => {
    const keys = dimension === 'lineOfBusiness' ? t.lineOfBusiness
      : dimension === 'treaty' ? [t.treatyName]
      : [t[dimension]];
    const treatyGross = claims.filter(c => c.treatyId === t.id).reduce((s, c) => s + claimIncurred(c), 0) || t.premium * 0; // exposure from claims
    const grossExposure = Math.max(treatyGross, 0) + t.premium; // premium as exposure proxy + incurred claims
    const protectedAmt = recoveriesByTreatyName.get(t.treatyName) ?? 0;
    keys.forEach(key => {
      const g = groups.get(key) ?? { gross: 0, protectedAmt: 0 };
      g.gross += grossExposure / keys.length;
      g.protectedAmt += protectedAmt / keys.length;
      groups.set(key, g);
    });
  });

  return Array.from(groups.entries())
    .map(([key, g]) => ({
      key,
      grossExposure: g.gross,
      protectedExposure: g.protectedAmt,
      netExposure: g.gross - g.protectedAmt
    }))
    .sort((a, b) => b.grossExposure - a.grossExposure);
};

/** MPL/PML proxies from layer structures: MPL = Σ capacity; PML at a loading. */
export const lossPotential = (programmes: RetroProgramme[], pmlFactor = 0.65) => {
  const maxPossibleLoss = programmes.reduce((s, p) => s + programmeCapacity(p) + p.retention, 0);
  return { maxPossibleLoss, probableMaximumLoss: maxPossibleLoss * pmlFactor };
};

/** Recovery aging on outstanding retro claims (days since notification). */
export const recoveryAging = (retroClaims: RetroClaim[]) => {
  const DAY = 24 * 60 * 60 * 1000;
  const buckets = [
    { label: '0–30 days', min: 0, max: 30 },
    { label: '31–90 days', min: 31, max: 90 },
    { label: '91–180 days', min: 91, max: 180 },
    { label: '180+ days', min: 181, max: Infinity }
  ];
  const open = retroClaims.filter(rc => rc.status !== 'Settled');
  return buckets.map(b => ({
    label: b.label,
    count: open.filter(rc => {
      const days = (Date.now() - new Date(rc.notificationDate).getTime()) / DAY;
      return days >= b.min && days <= b.max;
    }).length,
    amount: open.filter(rc => {
      const days = (Date.now() - new Date(rc.notificationDate).getTime()) / DAY;
      return days >= b.min && days <= b.max;
    }).reduce((s, rc) => s + (rc.expectedRecovery - rc.settledRecovery), 0)
  }));
};
