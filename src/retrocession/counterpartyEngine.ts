// Counterparty (retrocessionaire) engine: capacity usage, exposure share,
// outstanding recoveries, recovery speed, and concentration risk.

import type { RetroClaim, RetroProgramme, Retrocessionaire } from '@/components/DataStore';
import { ClaimRecovery, CounterpartyMetrics } from './types';

const DAY = 24 * 60 * 60 * 1000;

export const counterpartyMetrics = (
  retrocessionaires: Retrocessionaire[],
  programmes: RetroProgramme[],
  recoveries: ClaimRecovery[],
  retroClaims: RetroClaim[]
): CounterpartyMetrics[] => {
  // Signed capacity and recovery shares per counterparty
  const totalPlacedCapacity = programmes.reduce(
    (s, p) => s + p.layers.reduce((ls, l) => ls + l.limit * l.placements.reduce((ps, pl) => ps + pl.signedLinePct, 0) / 100, 0), 0);

  return retrocessionaires.map(rc => {
    let capacityUsed = 0;
    let exposure = 0;
    let outstanding = 0;
    let paid = 0;
    const programmeCodes = new Set<string>();

    programmes.forEach(programme => {
      programme.layers.forEach(layer => {
        const placement = layer.placements.find(p => p.retrocessionaireId === rc.id);
        if (!placement) return;
        programmeCodes.add(programme.programmeCode);
        const share = placement.signedLinePct / 100;
        capacityUsed += layer.limit * share;

        recoveries
          .filter(r => r.layerId === layer.id)
          .forEach(r => {
            exposure += r.expectedRecovery * share;
            outstanding += r.outstandingRecovery * share;
            paid += r.paidRecovery * share;
          });
      });
    });

    // Recovery speed: average days notification → settlement on settled retro claims
    const settlementDays = retroClaims
      .filter(rc2 => rc2.status === 'Settled' && rc2.settlementDate)
      .filter(rc2 => {
        const programme = programmes.find(p => p.id === rc2.programmeId);
        const layer = programme?.layers.find(l => l.id === rc2.layerId);
        return layer?.placements.some(p => p.retrocessionaireId === rc.id);
      })
      .map(rc2 => Math.max(0, (new Date(rc2.settlementDate!).getTime() - new Date(rc2.notificationDate).getTime()) / DAY));

    return {
      id: rc.id,
      name: rc.name,
      country: rc.country,
      creditRating: rc.creditRating,
      financialStrength: rc.financialStrength,
      capacityOffered: rc.capacityOffered,
      capacityUsed,
      exposure,
      outstandingRecoveries: outstanding,
      paidRecoveries: paid,
      recoverySpeedDays: settlementDays.length > 0
        ? settlementDays.reduce((s, d) => s + d, 0) / settlementDays.length
        : null,
      concentrationPct: totalPlacedCapacity > 0 ? (capacityUsed / totalPlacedCapacity) * 100 : 0,
      programmes: Array.from(programmeCodes)
    };
  }).sort((a, b) => b.capacityUsed - a.capacityUsed);
};

/** Security concentration flags: any counterparty above the threshold share. */
export const concentrationFlags = (metrics: CounterpartyMetrics[], thresholdPct = 40) =>
  metrics.filter(m => m.concentrationPct > thresholdPct);
