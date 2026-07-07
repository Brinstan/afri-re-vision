# Technical Debt & Known Limitations

An honest register of shortcuts, prototype simplifications, and cleanup opportunities.
None of these block current functionality; they matter for productionisation.

## Architectural / platform

| # | Item | Impact | Notes |
|---|---|---|---|
| 1 | **No backend** — all data in `localStorage` | No multi-user, no sharing, per-browser only | Core constraint; see [NEXT_STAGE.md](./NEXT_STAGE.md) |
| 2 | **Mock authentication** | Any non-empty credentials log in; role self-selected; no RBAC enforced | `AuthContext.tsx` — do not treat as security |
| 3 | **No server persistence / period close** | IFRS 17 opening balances are always zero; roll-forwards are inception-to-date | Real close needs a backend |
| 4 | **Single-browser data** | Clearing storage wipes everything | `resetData()` restores seed only |

## Calculation simplifications (intentional, documented)

| # | Item | Where |
|---|---|---|
| 5 | Discounting is single-period at an assumed 1-year duration | `ifrs17/assumptions.ts` `discountFactor`, `fulfilmentCashFlows.ts` |
| 6 | VFA measurement model is a placeholder (measured as GMM) | `ifrs17/lrc.ts` |
| 7 | GMM CSM measured at initial recognition, released on earned fraction — no accretion/unlocking | `ifrs17/lrc.ts` |
| 8 | Mack standard error is a simplified process-variance proxy, not full Mack | `lib/actuarial.ts` `mackStandardErrors` |
| 9 | Cost-of-capital risk adjustment uses a fixed 25% capital proxy × 2-year duration | `ifrs17/riskAdjustment.ts` |
| 10 | Premium exposure allocated wholly to inception year; empty origins get an average | `lib/actuarial.ts` `premiumByOrigin` |
| 11 | Currency selector labels reports but performs **no FX conversion** | `IfrsReporting.tsx` |

These are surfaced to users via "Basis of Preparation" notes and inline descriptions —
keep that transparency when extending them.

## Module-level

| # | Item | Where |
|---|---|---|
| 12 | Retrocession program structure & treaty allocations use illustrative in-component data, not the store | `RetrocessionModule.tsx` |
| 13 | Pricing metrics (technical/commercial rate, risk factors) are illustrative; only the layer maths is live | `PricingSystem.tsx` |
| 14 | Investments list is local component state, not in `DataStore` | `AccountingModule.tsx` |
| 15 | `layerDistribution` on claims is richer than the `LayerAllocation` interface; consumers read fields defensively | `DataStore.tsx`, `ClaimsModuleLinked.tsx`, `lib/actuarial.ts` |

## Front-end quality

| # | Item | Impact |
|---|---|---|
| 16 | **ESLint config crashes** — `@typescript-eslint/no-unused-expressions` throws (`allowShortCircuit`) under the installed versions | `npm run lint` unusable; `tsc --noEmit` is the working gate |
| 17 | **Hardcoded palette classes** (`text-gray-900`, `bg-white`, `bg-blue-50`) in older modules don't adapt to dark mode | Cosmetic in dark mode; migrate to semantic tokens |
| 18 | **Bundle > 500 kB** (single chunk, ~640 kB JS) | Build warns; no code-splitting/lazy routes |
| 19 | **Two toast systems** mounted (shadcn `Toaster` + `sonner`); only sonner is used | Minor; standardise on sonner |
| 20 | **Unused installed deps** — `react-hook-form`, `zod`, `@tanstack/react-query` present but feature code doesn't use them | Forms are hand-controlled |
| 21 | **No automated tests** | The pure calc libraries (`lib/actuarial.ts`, `ifrs17/*`) are ideal unit-test targets but untested |
| 22 | Line-ending warnings (LF→CRLF) on Windows checkouts | Harmless; consider a `.gitattributes` |

## Suggested cleanup order

1. Fix ESLint config (17) so linting works again — cheap, unblocks CI.
2. Add unit tests around `lib/actuarial.ts` and `src/ifrs17/*` (21) — highest value,
   these are pure and correctness-critical.
3. Make Retrocession/Investments store-driven (12, 14) for full data consistency.
4. Migrate hardcoded colors to tokens (17) for clean dark mode.
5. Code-split routes/modules (18) to shrink the initial bundle.
