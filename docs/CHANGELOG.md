# Changelog

All notable changes, by delivered stage. Commits are on `main`.

## Stage 7 — Feature-Based Access Control + Enterprise Blueprint

**Access control (implemented):**
- `src/access/permissions.ts` — module catalogue (10 features), role templates
  (System Administrator, Underwriter, Claims Officer, Accountant, Actuary,
  Finance Manager, Executive, Custom), SHA-256 password hashing helpers.
- `src/components/UserStore.tsx` — persisted user registry
  (`afrirevision-users`, survives business-data reset); seeded administrator
  (admin/admin123, flagged until password changed); authenticate/add/update/
  setPassword/remove with guards.
- `AuthContext` rewritten — sessions map to live registry accounts (stale or
  deactivated sessions are invalidated); `hasModule()`; `refreshSession()`.
- `LoginForm` — real credential check (no more "any password"); first-run hint.
- **Administration module** (`AdminModule.tsx`) — user table, per-user module
  grants via role template + checkbox tailoring, access matrix view, password
  management, activate/deactivate. Guards: cannot remove own admin access,
  cannot deactivate/delete self or the last administrator.
- Dashboard navigation, content routing, and quick actions all filter to the
  signed-in user's granted modules; revoked access falls back gracefully.

**Enterprise blueprint (docs/enterprise/, 10 documents):** business analysis,
PRD (MoSCoW), architecture incl. the 13-layer production stack, database
design (DDL + RLS + audit), UI/UX, roadmap (3 releases, 7-sprint MVP),
testing strategy, DevOps, coding standards, and an AI development handoff
blueprint for the backend build.

## Dark-mode overhaul (post-6B polish)

Resolved TECH_DEBT #17 — professional dark mode across the whole app.

- Migrated all hardcoded gray/white palette classes in 13 components to
  semantic shadcn tokens (`bg-card`, `bg-muted`, `text-foreground`,
  `text-muted-foreground`, `border-border`), so structure inherits the theme.
- Added `dark:` variants to every colored accent (status badges, alert tints,
  KPI deltas, gradient banners) — e.g. `bg-green-100 text-green-800` now pairs
  with `dark:bg-green-950/50 dark:text-green-300`.
- Themed the recharts default tooltip via `index.css` (was hardcoded white,
  unreadable in dark mode).
- Verified with a computed-style audit across all 9 modules in both themes:
  no light backgrounds or near-black text remain in dark mode.

## Stage 6B — Explainable AI Pricing & Underwriting Intelligence

Adds an explainable AI layer under `src/pricing/ai/` that AUGMENTS the Stage 6A
deterministic engines — every output shows its variables, weights, confidence
and sensitivity; no black boxes.

- **`ai/types.ts`** — Explanation/Recommendation/RiskScore/PortfolioFit types.
- **`ai/features.ts`** — feature engineering from live experience + 6A output
  (loss ratio & volatility, frequency, severity, largest loss, credibility Z,
  rate adequacy, cedant concentration) plus a shared confidence model.
- **`ai/models.ts`** — risk scoring (0–10, five disclosed weights), portfolio
  fit (0–100), rule-based risk appetite assessment, generic sensitivity
  analysis, and a Model Registry documenting the backend-ML replacement path
  for each heuristic.
- **`ai/recommendations.ts`** — suggested premium (anchored to the 6A office
  premium, ±3%/risk point), retention/deductible (severity-anchored), capacity
  (largest-loss + risk-scaled), layer structure (40/60 split), ceding
  commission (LR sliding scale 10–32.5%), profit margin (risk & volatility
  adjusted), treaty structure (frequency/volatility rules), and renewal
  recommendations across the in-force book (renew / rate increase /
  restructure / decline with rationale and confidence).
- **`ai/optimization.ts`** — business-mix optimization (grow/hold/shrink per
  line under a 45% concentration cap, rate-adequacy driven).
- **UI:** three new tabs — AI Advisor (recommendation cards with full
  explanations + Model Registry), Risk & Fit (risk score, portfolio fit,
  appetite checks, renewal decision support), Optimization (mix suggestions +
  executive AI dashboard).

## Stage 6A — Enterprise Traditional Pricing Engine

Replaced the mock "AI-Powered Pricing" screen with a deterministic actuarial
pricing workstation ("Pricing System") built on `src/pricing/` — no AI/ML in
this phase (that is Stage 6B).

- **`src/pricing/` engines (11 files):** `types.ts`, `assumptions.ts`
  (persisted loadings/inflation/credibility parameters), `burningCost.ts`
  (trended experience table, burning cost, experience rating with worst-year
  trimming + stability margin), `exposureRating.ts` (power exposure curve for
  layers; cession/ELR for proportional; deterministic excess for stop loss),
  `frequencySeverity.ts` (frequency × hit probability × in-structure severity),
  `credibility.ts` (limited-fluctuation √(n/N) blend of experience vs exposure
  prior), `premiumBuildUp.ts` (technical → office premium via the loading
  division method; rate on subject and rate on line), `treatyPricing.ts`
  (orchestrator for all six arrangement types), `scenario.ts` (5 standard
  stresses re-run through the full pipeline), `validation.ts`, `analytics.ts`
  (portfolio rate adequacy by line), `reporting.ts` (CSV + print-to-PDF memo).
- **UI:** 6-tab workstation (Setup, Methods, Premium Build-Up, Scenarios,
  Validation, Portfolio Analytics) with LOB selection from the live portfolio,
  type-specific structure inputs, derived subject premium with override,
  persisted pricing history (Draft/Quoted), and headline premium cards.
- All hardcoded metrics removed; every figure computes from live DataStore
  claims/treaties and Stage 2 helpers (`claimIncurred`, `inflate`).
- Dashboard nav renamed "AI Pricing" → "Pricing".

### Stage 6A.1 — Historical import, cedant recall, expanded LOBs
- **Standard LOB catalogue** (Fire, Engineering, Aviation, Liability,
  Agriculture, Accident & Health, Energy, Bonds & Credit, …) merged with
  portfolio and imported lines.
- **CSV experience import** (`pricing/externalData.ts`): tolerant header
  matching (Year/UW Year, Premium/GWP, Losses/Claims Incurred, …), row
  validation, downloadable template, persisted in DataStore
  (`externalExperience`) with audit logging. Imported aggregate losses are
  exploded into average-severity synthetic losses so per-claim structure
  mapping (XOL capping) applies; premiums/losses trend like portfolio data.
- **Cedant recall**: pick a cedant (or type a contract number) and both the
  live portfolio and imported history filter to that counterparty across all
  methods, scenarios and the experience table.

## Stage 5 — Enterprise Retrocession Management Platform

Rebuilt `RetrocessionModule.tsx` as an outward-reinsurance platform with engine
logic under `src/retrocession/`.

- **DataStore:** new persisted slices — `retroProgrammes` (typed programmes with
  layers and placements), `retroClaims` (recovery lifecycle), `retrocessionaires`
  (security panel) — all with audit logging.
- **`src/retrocession/` engines:** `types.ts`, `recoveryEngine.ts` (per-claim
  layer allocation, proportional & non-proportional, IBNR-loaded reserves),
  `capacityEngine.ts` (attachment/exhaustion/width/utilization/aggregate
  exposure), `counterpartyEngine.ts` (capacity used, exposure, recovery speed,
  concentration), `validation.ts` (signed lines = 100%, overlaps/gaps,
  duplicates, dates, recovery limits), `analytics.ts` (programme profitability,
  portfolio protection, exposure by dimension, MPL/PML, recovery aging),
  `reporting.ts` (5 CSV registers + executive/board print-to-PDF report).
- **Accounting integration:** journal derivation extended — programme layer
  premiums (Dr 5200 / Cr 2200), override commission (new account 4110), and
  settled retro recoveries (Dr Bank / Cr 1200). Programme-based retro premium
  supersedes the per-treaty retroPercentage journal when programmes exist.
- **Actuarial integration:** recovery reserves loaded with the IBNR/incurred
  ratio from the selected reserving method (reused, not recomputed).
- **UI:** 7-tab workstation — Programmes (create/expire/mid-term adjust, layer
  visuals), Placements (signed lines with over-placement guard), Recoveries
  (auto-computed register with Notify action), Retro Claims (Notify → Approve →
  Settle/Dispute lifecycle + aging), Counterparties (security dashboard with
  concentration flags), Analytics (gross vs net, cost vs recoveries, exposure
  distribution), Validation (live rule evaluation). Global filter bar.
- **Docs:** CHANGELOG, ROADMAP, NEXT_STAGE, TECH_DEBT updated; DECISIONS.md added.

## Stage 3 — Enterprise IFRS 17 Reporting Engine (`64f6646`)

Rebuilt `IfrsReporting.tsx` as a live IFRS 17 workstation with modular calculations
under `src/ifrs17/`.

- **New `src/ifrs17/` library:** `types.ts`, `assumptions.ts`, `riskAdjustment.ts`,
  `lrc.ts`, `lic.ts`, `fulfilmentCashFlows.ts`, `financialStatements.ts`, `reporting.ts`.
- Measurement models: PAA auto-assigned for coverage ≤ 12 months, else GMM; VFA
  placeholder; per-treaty overrides.
- LRC roll-forward (PAA earned premium; GMM fulfilment cash flows + CSM with day-one
  loss component).
- LIC roll-forward from case reserves + paid claims + actuarial IBNR (allocated to
  treaties) + risk adjustment.
- Fulfilment cash flows; risk adjustment with three methods (% of reserves, confidence
  level, cost of capital placeholder).
- Reinsurance issued/held; draft financial statements (service result, finance expense,
  technical result); treaty & cedant performance.
- Filter bar (valuation date, currency, cedant, treaty, broker, country, LOB, accident
  year, UW year); assumptions panel separating user inputs from calculated values.
- Exports: LRC/LIC CSV, Excel-compatible analysis, print-to-PDF management report.
- Reuses Stage 2 actuarial IBNR/ELR/selected method; exported claim helpers from the
  actuarial library. 10 files changed, +1,411 / −674.

## Stage 2 — Enterprise Actuarial Engine (`379ad5b`)

Replaced the demo Actuarial Engine with a data-driven reserving workstation.

- **New `src/lib/actuarial.ts`:** pure computation library.
- Loss triangle engine (paid, incurred, reported) built from real claim dates/amounts;
  claims inflation restatement.
- Reserving methods: Chain Ladder, Bornhuetter-Ferguson, Expected Loss Ratio, Cape Cod
  (data-implied ELR) + simplified Mack standard errors. Ultimate, IBNR, RBNS, reserves.
- Method comparison dashboard with actuary-selectable preferred methodology (recorded
  in governance, persisted).
- Assumptions layer (claims/premium inflation, ELR, tail factor, factor selection),
  persisted.
- Diagnostics (development factor stability, paid-to-incurred maturity, adequacy flags).
- XOL layer analytics aligned with `ClaimsModuleLinked`; portfolio analytics.
- recharts visuals; triangle CSV + print-to-PDF reserve report.
- Grouping by accident/underwriting year, LOB, cedant, treaty. Exported `Treaty`/`Claim`
  types; added paid/payment fields to `Claim`. 3 files changed, +1,397 / −256.

## Stage 1 — Foundation Stabilization & Functional Completion (`31f6f85`)

Turned the prototype into a functional application.

- Dark mode toggle (`ThemeContext`, persisted).
- **`DataStore` persistence** via Zustand `persist` middleware (data survives reload);
  `resetData()` action; `any` types replaced with `PremiumBooking`/`LayerAllocation`.
- Dashboard: live KPIs and portfolio counts; Settings dialog with confirmed data reset.
- Underwriting: wired ~35 uncontrolled inputs, duplicate-contract prevention,
  date/premium validation, preview/view dialogs, full form reset.
- Treaty: computed booking totals and monthly-return ratios, book returns to store, CSV
  export, live inward search, mark bookings paid.
- Claims: stable sequential claim references, date-of-loss capture/validation, layer
  capacity updates, document downloads, pay action.
- Accounting: new-payable dialog with validation, payment-preserving refresh, allocate
  receivable payments, payable view dialog.
- Retrocession: create/search/view/export outward treaties, saveable config,
  deterministic utilization.
- Pricing: editable layer table with computed premiums, pricing history, accept/export.
- Actuarial: export reserve results (later superseded by Stage 2).
- Portfolio: wired detail dialogs.
- Removed 6 unused module variants (~2,900 lines dead code). 19 files changed,
  +1,943 / −3,473.

## Pre-Stage-1 baseline

Initial Lovable-generated prototype: full UI scaffold, shadcn/ui component set, mock
auth, in-memory `DataStore` with sample data, and multiple non-functional / duplicated
module variants. No persistence.
