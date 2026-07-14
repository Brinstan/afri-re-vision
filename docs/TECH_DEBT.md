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

## Stage 4/5 additions

| # | Item | Where |
|---|---|---|
| 23 | FX rates are manually configured indicative defaults — no rates API | `accounting/currency.ts` |
| 24 | Audit trail is client-side (localStorage) and erasable — not tamper-proof | `DataStore.tsx` |
| 25 | Retro recovery reserve = outstanding × (1 + IBNR/incurred ratio) — a proxy, not a per-layer actuarial projection | `retrocession/recoveryEngine.ts` |
| 26 | Exposure uses premium + incurred claims as the gross-exposure proxy (no sum-insured data exists) | `retrocession/analytics.ts` |
| 27 | PML = MPL × 0.65 fixed factor — placeholder until modelled | `retrocession/analytics.ts` |
| 28 | Legacy `treaty.retroPercentage` still drives IFRS 17 Reinsurance Held; programme-based cession supersedes it only in accounting journals | `ifrs17/financialStatements.ts`, `accounting/journals.ts` |
| 29 | Surplus retro uses an estimated average cession % — true surplus cession varies per risk with sum insured, which doesn't exist in the data model | `retrocession/recoveryEngine.ts` |
| 30 | Reinstatement terms on XOL/Cat retro are captured and displayed but reinstatement premiums on retro recoveries are not yet auto-booked | `retrocession/recoveryEngine.ts` |
| 31 | ~~Pricing metrics illustrative~~ **Resolved in Stage 6A** — item 13 superseded; all pricing computes from live data | `PricingSystem.tsx` |
| 32 | Exposure rating uses a one-parameter power curve on an MPL proxy, not market exposure curves (no per-risk sum-insured profile) | `pricing/exposureRating.ts` |
| 33 | Stop-loss exposure rating is a deterministic excess over the ELR — no aggregate loss distribution/volatility model | `pricing/exposureRating.ts` |
| 34 | Surplus pricing relies on a user-estimated ceded share (same per-risk data gap as #29) | `pricing/treatyPricing.ts` |
| 35 | Experience import accepts CSV only — native .xlsx parsing needs a library (SheetJS); Excel users must Save As CSV | `pricing/externalData.ts` |
| 36 | Imported aggregate losses are exploded at average severity per year/row — individual large losses in imports are smoothed, understating XOL layer costs for skewed years | `pricing/externalData.ts` |
| 37 | AI layer is heuristic, not trained — weights are expert-set constants; the Model Registry documents the intended backend ML replacements | `pricing/ai/models.ts` |
| 38 | Risk appetite limits (LR ≤ 80%, concentration ≤ 60%, etc.) are hardcoded rules, not user-configurable appetite statements | `pricing/ai/models.ts` |

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
| 12 | ~~Retrocession illustrative in-component data~~ **Resolved in Stage 5** — programmes, placements, retro claims, and counterparties are store-backed | `RetrocessionModule.tsx` |
| 13 | Pricing metrics (technical/commercial rate, risk factors) are illustrative; only the layer maths is live | `PricingSystem.tsx` |
| 14 | ~~Investments in local component state~~ **Resolved in Stage 4** — store-backed with bank funding and journals | `AccountingModule.tsx` |
| 15 | `layerDistribution` on claims is richer than the `LayerAllocation` interface; consumers read fields defensively | `DataStore.tsx`, `ClaimsModuleLinked.tsx`, `lib/actuarial.ts` |

## Front-end quality

| # | Item | Impact |
|---|---|---|
| 16 | **ESLint config crashes** — `@typescript-eslint/no-unused-expressions` throws (`allowShortCircuit`) under the installed versions | `npm run lint` unusable; `tsc --noEmit` is the working gate |
| 17 | ~~Hardcoded palette classes don't adapt to dark mode~~ **Resolved** — grays migrated to semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`), colored accents given `dark:` variants, recharts tooltip themed in `index.css` | 13 components |
| 18 | **Bundle > 500 kB** (single chunk, ~640 kB JS) | Build warns; no code-splitting/lazy routes |
| 19 | **Two toast systems** mounted (shadcn `Toaster` + `sonner`); only sonner is used | Minor; standardise on sonner |
| 20 | **Unused installed deps** — `react-hook-form`, `zod`, `@tanstack/react-query` present but feature code doesn't use them | Forms are hand-controlled |
| 21 | **No automated tests** | The pure calc libraries (`lib/actuarial.ts`, `ifrs17/*`) are ideal unit-test targets but untested |
| 22 | Line-ending warnings (LF→CRLF) on Windows checkouts | Harmless; consider a `.gitattributes` |

## Suggested cleanup order

1. Fix ESLint config (16) so linting works again — cheap, unblocks CI.
2. Add unit tests around `lib/actuarial.ts` and `src/ifrs17/*` (21) — highest value,
   these are pure and correctness-critical.
3. Code-split routes/modules (18) to shrink the initial bundle.
4. ~~Migrate hardcoded colors to tokens (17)~~ done.
