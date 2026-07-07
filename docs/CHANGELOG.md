# Changelog

All notable changes, by delivered stage. Commits are on `main`.

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
