# Next Stage — Recommendation

All planned functional stages are delivered **client-side**: operations (Stage 1),
actuarial (2), IFRS 17 (3), accounting (4), retrocession (5), deterministic pricing
(6A), and explainable AI pricing intelligence (6B). The biggest remaining limitation is
that everything lives in one browser, so the recommended next stage is **persistence,
identity, and period close** — a backend that also unlocks real ML training for the
Stage 6B Model Registry (each heuristic documents its replacement model).

## Stage 4 (recommended): Backend, Auth & Period Close

### Goals
1. **Real persistence** — a database behind `DataStore` so data is shared, durable, and
   multi-user.
2. **Real authentication & RBAC** — replace `AuthContext`'s mock with proper identity
   and enforce Finance vs Operations permissions server-side.
3. **Period close** — persist closing balances per valuation date so IFRS 17 opening
   balances become real and roll-forwards become period-over-period (removing the
   zero-opening-balance limitation, [TECH_DEBT.md](./TECH_DEBT.md) #3, #7).

### Why this order
The calculation engines (Stage 2 actuarial, Stage 3 IFRS 17) are already pure and
correct-by-construction; they don't need rework. What they lack is durable, shared,
time-versioned inputs — a backend provides exactly that without touching the maths.

### Suggested approach (keep it incremental)
- Introduce a thin data-access layer that mirrors today's `DataStore` action surface
  (`addTreaty`, `addClaim`, `addPremiumBooking`, …) so modules don't change.
- Start with a managed backend (e.g. Supabase/Firebase) to avoid standing up infra;
  the store's shape maps cleanly to tables (treaties, claims, premium_bookings,
  underwriting_contracts).
- Keep the pure calc libraries untouched — they take data in and return results.

## Backend integration points (from the calc layers)

These are the concrete seams the current code already exposes for a backend:

| Integration point | What it enables | Referenced in |
|---|---|---|
| **Period-close service** | Real IFRS 17 opening balances; period roll-forwards | `ifrs17/lrc.ts`, `ifrs17/lic.ts` |
| **Yield-curve service** | Term-dependent discounting instead of single-period | `ifrs17/assumptions.ts` `discountFactor` |
| **FX rates API** | Multi-currency consolidation (currency selector is label-only today) | `IfrsReporting.tsx` |
| **Audit log** | Capture assumption changes and report generation for governance | Actuarial & IFRS 17 assumption panels |
| **Report archive** | Immutable stored statements per valuation date | `ifrs17/reporting.ts` |
| **Auth/RBAC service** | Enforce role permissions (currently unenforced) | `AuthContext.tsx` |

## Parallel quality track (do alongside Stage 4)

- **Unit tests** for `src/lib/actuarial.ts` and `src/ifrs17/*` — pure functions, high
  value, currently untested ([TECH_DEBT.md](./TECH_DEBT.md) #21).
- **Fix ESLint** so linting/CI works ([TECH_DEBT.md](./TECH_DEBT.md) #16).
- **Code-split** modules/routes to shrink the bundle (#18).

## Explicitly out of scope for the next stage
- Reworking actuarial or IFRS 17 formulas (they're done and intentionally simplified;
  deepen only after balances are real).
- Redesigning the UI or swapping Zustand/shadcn/Tailwind.
- New business modules — finish making Retrocession/Pricing/Investments fully
  store-driven before adding scope.
