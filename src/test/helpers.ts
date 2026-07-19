// Shared factories for engine tests. Minimal valid objects; override per test.
import type { Treaty, Claim, RetroProgramme, RetroLayer } from '../components/DataStore';

let seq = 0;
const nid = () => `T-${++seq}`;

export const mkTreaty = (over: Partial<Treaty> = {}): Treaty => ({
  id: nid(),
  contractNumber: `CN-${seq}`,
  treatyName: `Treaty ${seq}`,
  cedant: 'Test Cedant',
  broker: 'Test Broker',
  country: 'Tanzania',
  inceptionDate: '2023-01-01',
  expiryDate: '2023-12-31',
  participationShare: 100,
  retroPercentage: 0,
  commission: 25,
  premium: 1_000_000,
  currency: 'USD',
  status: 'Active',
  lineOfBusiness: ['Property'],
  ...over,
} as Treaty);

export const mkClaim = (over: Partial<Claim> = {}): Claim => ({
  id: nid(),
  claimNumber: `CLM-${seq}`,
  contractNumber: 'CN-1',
  treatyId: 'T-1',
  insuredName: 'Insured',
  claimAmount: 100_000,
  reserveAmount: 100_000,
  currency: 'USD',
  status: 'Outstanding',
  dateOfLoss: '2023-06-15',
  dateReported: '2023-07-01',
  claimDescription: 'test loss',
  ...over,
} as Claim);

export const mkLayer = (over: Partial<RetroLayer> = {}): RetroLayer => ({
  id: nid(),
  name: 'Layer 1',
  attachmentPoint: 0,
  limit: 1_000_000,
  premium: 100_000,
  placements: [],
  ...over,
});

export const mkProgramme = (over: Partial<RetroProgramme> = {}): RetroProgramme => ({
  id: nid(),
  programmeCode: `RP-${seq}`,
  programmeName: `Programme ${seq}`,
  type: 'Quota Share',
  effectiveDate: '2023-01-01',
  expiryDate: '2023-12-31',
  currency: 'USD',
  linesOfBusiness: ['Property'],
  territory: 'Africa',
  cedingCompany: 'AfriRe',
  retroBroker: 'Broker',
  retention: 0,
  cessionPct: 50,
  commissionPct: 20,
  layers: [],
  status: 'Active',
  renewalStatus: 'New',
  ...over,
} as RetroProgramme);
