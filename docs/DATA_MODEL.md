# Data Model

The domain source of truth is `src/components/DataStore.tsx` — a Zustand store
persisted to `localStorage` (`afrirevision-data`) via the `persist` middleware.
It seeds with sample data (2 treaties, 1 claim, 1 underwriting contract) and exposes
a `resetData()` action to restore that seed.

`Treaty` and `Claim` are exported types (used by `src/lib/actuarial.ts` and
`src/ifrs17/*`). `PremiumBooking` and `LayerAllocation` are also exported.

## Entities

### Treaty

```ts
interface Treaty {
  id: string;
  contractNumber: string;
  treatyName: string;
  cedant: string;
  broker: string;
  country: string;
  inceptionDate: string;        // ISO date
  expiryDate: string;           // ISO date
  participationShare: number;   // %
  retroPercentage: number;      // % ceded to retrocession
  commission: number;           // %
  premium: number;
  currency: string;
  status: 'Active' | 'Pending' | 'Expired';
  lineOfBusiness: string[];
  layers?: Array<{              // XOL structure
    name: string;
    limit: number;
    retention: number;
    reinstatementRate: number;  // %
    deductible: number;
    remainingCapacity: number;  // reduced as claims consume the layer
  }>;
  deductible?: number;
  insuredName?: string;
  premiumBookings?: PremiumBooking[];
}
```

### PremiumBooking

```ts
interface PremiumBooking {
  id: string;
  amount: number;
  type: string;                 // 'MDP' | 'Adjustment' | 'Reinstatement' | 'Monthly Return (...)' | 'Claim Payment (...)' | ...
  date: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  paidAmount?: number;
}
```

Premium bookings live **inside** their treaty (`treaty.premiumBookings`). They are the
join point for Accounting (receivables) and IFRS 17 (premium received).

### Claim

```ts
interface Claim {
  id: string;
  claimNumber: string;          // e.g. TAN/MV/TTY/2024/0001
  contractNumber: string;       // links to treaty.contractNumber
  treatyId: string;             // links to treaty.id
  insuredName: string;
  claimAmount: number;
  reserveAmount: number;
  currency: string;
  status: string;               // 'Outstanding' | 'Full Payment' | 'Settled' | 'Partial Payment' | 'Under Review' | ...
  dateOfLoss: string;           // drives actuarial accident year
  dateReported: string;         // drives development lag for reported/incurred
  dateApproved?: string;
  claimDescription: string;
  retroRecovery?: number;
  reinstatementPremium?: number;
  layerDistribution?: LayerAllocation[];
  paidAmount?: number;          // written by Accounting on payment
  paymentDate?: string;         // drives development lag for paid triangle
  paymentReference?: string;
}
```

### LayerAllocation

```ts
interface LayerAllocation {
  layerName: string;
  allocation: number;
  reinstatementPremium?: number;
  // Claims module also stores richer per-layer objects (payableAmount,
  // remainingCapacityAfter, utilizationPercentage, …) in layerDistribution.
}
```

> Note: `ClaimsModuleLinked` stores a richer object shape in `layerDistribution`
> than the minimal `LayerAllocation` interface. Consumers read fields defensively
> (`l.payableAmount ?? l.allocation ?? 0`). Unifying this is tracked in
> [TECH_DEBT.md](./TECH_DEBT.md).

### UnderwritingContract

```ts
interface UnderwritingContract {
  id: string;
  contractNumber: string;
  underwritingYear: string;
  contractType: string;         // 'quota' | 'surplus' | 'xol' | 'stoploss' | 'facultative'
  treatyName: string;
  cedants: Array<{ name: string; reference: string; country: string }>;
  brokers: Array<{ name: string; reference: string; commission: number }>;
  linesOfBusiness: string[];
  premium: number;
  currency: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Closed';
  inceptionDate: string;
  expiryDate: string;
  // Underwriting also attaches signedShare, xolLayers, terms on save (loosely typed).
}
```

## Store actions

```ts
// Treaties
addTreaty(treaty)
updateTreaty(id, updates)
getTreatyByContractNumber(contractNumber)

// Claims
addClaim(claim)
updateClaim(id, updates)
getClaimsByTreaty(treatyId)

// Underwriting
addUnderwritingContract(contract)
updateUnderwritingContract(id, updates)
convertUnderwritingToTreaty(contractId)   // creates a Treaty from a Draft contract

// Premium bookings
addPremiumBooking(treatyId, booking)
updatePremiumPaymentStatus(treatyId, bookingId, status, paidAmount?)

// Utility
resetData()                               // restore seed data
```

## Relationships

```
UnderwritingContract ──convertUnderwritingToTreaty()──▶ Treaty
Treaty 1 ───────────< PremiumBooking   (embedded array)
Treaty 1 ───────────< Claim            (Claim.treatyId / Claim.contractNumber)
Treaty   ──layers──< XOL layer         (consumed by claims → remainingCapacity ↓)
Claim    ──retroRecovery / reinstatementPremium──▶ Retrocession & Premium bookings
```

- A **claim links to a treaty** by both `treatyId` and `contractNumber`. The Claims
  module reduces the matched treaty's `layers[].remainingCapacity` when an XOL claim
  is registered, and auto-books a reinstatement premium.
- **Accounting** derives payables (claims, commissions) and receivables (premium
  bookings) from treaties + claims; paying a claim writes `paidAmount`/`paymentDate`
  back onto the `Claim`.
- **Actuarial** groups claims by accident year (`dateOfLoss`) and treaties by
  underwriting year (`inceptionDate`).
- **IFRS 17** consumes treaties, claims, premium bookings, and actuarial IBNR.

## Non-domain persisted state

| Store | localStorage key | Owner |
|---|---|---|
| Domain data | `afrirevision-data` | `DataStore.tsx` |
| User session (mock) | `user` | `AuthContext.tsx` |
| Theme | `theme` | `ThemeContext.tsx` |
| Actuarial assumptions | `afrirevision-actuarial-assumptions` | `ActuarialEngine.tsx` |
| IFRS 17 assumptions | `afrirevision-ifrs17-assumptions` | `ifrs17/assumptions.ts` |

### AuthContext

```ts
interface User { id: string; username: string; userType: 'Finance' | 'Operations'; }
```

`login(username, password, userType)` accepts **any** non-empty credentials and stores
the user. This is a mock — see [TECH_DEBT.md](./TECH_DEBT.md).
