// Layer & capacity engine: attachment/exhaustion, width, utilization from
// allocated recoveries, aggregate exposure from placements.

import type { RetroProgramme } from '@/components/DataStore';
import { ClaimRecovery, LayerMetrics } from './types';

export const layerMetrics = (programmes: RetroProgramme[], recoveries: ClaimRecovery[]): LayerMetrics[] =>
  programmes.flatMap(programme =>
    programme.layers.map(layer => {
      const consumed = recoveries
        .filter(r => r.layerId === layer.id)
        .reduce((s, r) => s + r.expectedRecovery, 0);
      const remaining = Math.max(0, layer.limit - consumed);
      const placementTotalPct = layer.placements.reduce((s, p) => s + p.signedLinePct, 0);
      return {
        layerId: layer.id,
        layerName: layer.name,
        programmeId: programme.id,
        programmeCode: programme.programmeCode,
        attachmentPoint: layer.attachmentPoint,
        exhaustionPoint: layer.attachmentPoint + layer.limit,
        layerWidth: layer.limit,
        capacity: layer.limit,
        consumed,
        remainingCapacity: remaining,
        utilizationPct: layer.limit > 0 ? (consumed / layer.limit) * 100 : 0,
        aggregateExposure: layer.limit * placementTotalPct / 100,
        recoverableLimit: remaining,
        placementTotalPct
      };
    })
  );

/** Total programme capacity = Σ layer limits. */
export const programmeCapacity = (programme: RetroProgramme): number =>
  programme.layers.reduce((s, l) => s + l.limit, 0);

/** Programme-level utilization across its layers. */
export const programmeUtilization = (programme: RetroProgramme, metrics: LayerMetrics[]): number => {
  const rows = metrics.filter(m => m.programmeId === programme.id);
  const capacity = rows.reduce((s, m) => s + m.capacity, 0);
  const consumed = rows.reduce((s, m) => s + m.consumed, 0);
  return capacity > 0 ? (consumed / capacity) * 100 : 0;
};
