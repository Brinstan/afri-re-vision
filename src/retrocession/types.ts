// Shared types for the retrocession engines. Domain entities live in
// DataStore.tsx (RetroProgramme, RetroLayer, RetroPlacement, RetroClaim,
// Retrocessionaire); these types describe computed results.

export interface LayerMetrics {
  layerId: string;
  layerName: string;
  programmeId: string;
  programmeCode: string;
  attachmentPoint: number;
  exhaustionPoint: number;          // attachment + limit
  layerWidth: number;               // = limit
  capacity: number;                 // limit (per-occurrence capacity)
  consumed: number;                 // recoveries allocated to this layer
  remainingCapacity: number;
  utilizationPct: number;
  aggregateExposure: number;        // Σ signed capacity across placements
  recoverableLimit: number;         // remaining recoverable on the layer
  placementTotalPct: number;        // Σ signed lines (target 100)
}

export interface ClaimRecovery {
  claimId: string;
  claimNumber: string;
  treatyName: string;
  programmeId: string;
  programmeCode: string;
  layerId: string;
  layerName: string;
  grossLoss: number;
  retention: number;                // amount below the programme attachment
  recoverableAmount: number;        // amount ceded into the programme layers
  expectedRecovery: number;         // recoverable, capped at layer capacity
  paidRecovery: number;             // settled via retro claims
  outstandingRecovery: number;      // expected − paid
  recoveryReserve: number;          // outstanding + share of IBNR-driven reserve
  netRetainedLoss: number;          // gross − expected recovery
  currency: string;
}

export interface CounterpartyMetrics {
  id: string;
  name: string;
  country: string;
  creditRating: string;
  financialStrength: string;
  capacityOffered: number;
  capacityUsed: number;             // Σ signed line × layer limit
  exposure: number;                 // share of expected recoveries
  outstandingRecoveries: number;
  paidRecoveries: number;
  recoverySpeedDays: number | null; // avg notification → settlement
  concentrationPct: number;         // share of total placed capacity
  programmes: string[];             // programme codes participated in
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  scope: string;                    // programme code / layer / claim reference
  message: string;
}

export interface ExposureRow {
  key: string;
  grossExposure: number;
  protectedExposure: number;
  netExposure: number;
}

export interface RetroFilters {
  programmeId: string;
  retrocessionaireId: string;
  broker: string;
  status: string;
  lineOfBusiness: string;
  recoveryStatus: string;
  search: string;
}

export const ALL_RETRO_FILTERS: RetroFilters = {
  programmeId: 'all', retrocessionaireId: 'all', broker: 'all',
  status: 'all', lineOfBusiness: 'all', recoveryStatus: 'all', search: ''
};
