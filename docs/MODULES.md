# Modules

Every domain module lives in `src/components/` and is rendered by
`pages/Dashboard.tsx` via the `activeModule` switch. Calculation-heavy modules
delegate to pure libraries (`src/lib/actuarial.ts`, `src/ifrs17/*`).

## Infrastructure

### `DataStore.tsx`
Zustand store, persisted to `localStorage`. Source of truth for treaties, claims,
underwriting contracts, and (embedded) premium bookings. Exports `Treaty`, `Claim`,
`PremiumBooking`, `LayerAllocation` types and `useDataStore`. See
[DATA_MODEL.md](./DATA_MODEL.md).

### `AuthContext.tsx`
Mock authentication (Context). `login()` accepts any non-empty credentials; user role
is self-selected. Persists to `localStorage` key `user`.

### `ThemeContext.tsx`
Light/dark theme (Context). Toggles the `dark` class on `<html>`, persists to `theme`.

### `LoginForm.tsx`
Login gate rendered when unauthenticated. Username, password, and user-type select.

## Application shell

### `pages/Dashboard.tsx`
The workspace. Header (live KPIs from the store, dark-mode toggle, Settings dialog with
data-reset confirmation, logout), tab navigation, and the module switch. The default
"dashboard" view shows KPI cards, quick actions, alerts, and a portfolio overview — all
computed from `DataStore`.

### `pages/Index.tsx`
Landing page with a link into the dashboard.

### `pages/NotFound.tsx`
404 route.

## Domain modules

### `UnderwritingModuleIntegrated.tsx`
Contract capture across 6 tabs (contract, parties, coverage, financial, clauses, saved
contracts). Supports quota/surplus/XOL/stop-loss/facultative with type-specific terms.
Validation (unique contract number, date order, positive premium, lines, parties),
preview and view dialogs, reset. **Convert to Treaty** turns a Draft into an active
treaty. All coverage/financial/clause inputs are captured into a `terms` map and stored.

### `TreatyManagementIntegrated.tsx`
Three tabs: **Premium Booking** (query treaty, book MDP/Adjustment/Reinstatement with
VAT/tax calc, confirmation), **Monthly Returns** (live loss/commission/combined ratios;
book return; CSV report), **Inward Treaty Display** (live search, treaty detail dialog
with premium bookings + linked claims, mark bookings paid). Reversal uses a confirm
dialog.

### `ClaimsModuleLinked.tsx`
Four tabs: **New Claim**, **Approved Claims**, **Inward Claims**, **Outstanding
Claims**. Auto-links treaties by contract number; sequential claim references; full XOL
per-layer distribution (`calculateXOLLayerDistribution`); on submit reduces treaty layer
capacity and auto-books reinstatement premiums. Claim advice / payment voucher text
exports; view/edit/pay actions. This is the authoritative XOL allocation logic that the
Actuarial XOL analytics aligns with.

### `AccountingModule.tsx`
Six tabs: **Receivables** (from premium bookings), **Payables** (claims + commissions +
manual, with a payment dialog that updates claim status and books the settlement),
**Investments** (in-component list with add/view/edit), **Financial Reports** (text
exports with progress), **Portfolio Analysis** (embeds `PortfolioAnalysis`),
**Dashboard** (KPI cards). "Refresh Data" preserves recorded payments and manual entries.

### `PortfolioAnalysis.tsx`
Rendered inside AccountingModule. Line-of-business and geographic analysis tables
(computed from the store) with detail dialogs, plus trend views.

### `RetrocessionModule.tsx`
Four tabs: **Program Structure**, **New Outward** (create outward treaties), **Outward
Display** (search/view/export), **Configuration** (allocation rules, saveable). Uses a
mix of live and illustrative in-component data — the program structure and treaty
allocation samples are not yet fully store-driven (see [TECH_DEBT.md](./TECH_DEBT.md)).

### `PricingSystem.tsx`
AI-styled pricing prototype: setup, editable multi-layer table (computed premiums),
risk analysis, results (accept/modify/export), market comparison, and a session pricing
history dialog. Pricing metrics are illustrative; the layer maths is live.

### `ActuarialEngine.tsx` (Stage 2)
The reserving **workbench** UI. Scope selector (accident/underwriting year, LOB, cedant,
treaty), headline reserve cards, and tabs: Assumptions, Triangles, Dev Factors, Method
Comparison, Diagnostics, XOL Analysis, Portfolio Analytics. All numbers come from
`src/lib/actuarial.ts`. Charts via recharts. Exports triangle CSVs and a print-to-PDF
reserve report. Persists assumptions to `afrirevision-actuarial-assumptions`.

### `IfrsReporting.tsx` (Stage 3)
The IFRS 17 **workstation** UI. Filter bar, headline LRC/LIC/revenue/technical-result
cards, and tabs: Statements, LRC, LIC & FCF, Reinsurance, Analytics, Assumptions
(user vs calculated values + measurement-model assignment). All numbers come from
`src/ifrs17/*` and reuse actuarial IBNR. Exports CSV, Excel-compatible analysis, and a
print-to-PDF management report. Persists to `afrirevision-ifrs17-assumptions`.

## Calculation libraries

### `src/lib/actuarial.ts` (pure)
Grouping/filtering helpers; triangle engine (`buildTriangle`, paid/incurred/reported);
`developmentFactors`; reserving methods (`chainLadder`, `bornhuetterFerguson`,
`capeCod`, `expectedLossRatioMethod`, `runAllMethods`); `mackStandardErrors`;
`paidToIncurredRatios`; `premiumByOrigin`; `xolAnalysis`; `portfolioAnalytics`;
CSV/`downloadFile` helpers; exported claim helpers (`claimPaid`, `claimCaseReserve`,
`claimIncurred`). `DEFAULT_ASSUMPTIONS`, `METHOD_LABELS`, and types are exported.

### `src/ifrs17/` (pure)
| File | Responsibility |
|---|---|
| `types.ts` | Measurement models, assumptions, filters, roll-forward & statement types |
| `assumptions.ts` | Defaults, persistence, PAA/GMM auto-assignment + overrides, earned fraction, discount factor |
| `riskAdjustment.ts` | Percentage-of-reserves, confidence-level, cost-of-capital (placeholder) |
| `lrc.ts` | Liability for Remaining Coverage roll-forward (PAA & GMM/CSM) |
| `lic.ts` | Liability for Incurred Claims roll-forward + IBNR allocation |
| `fulfilmentCashFlows.ts` | Expected claims/expenses, recoveries, discounting, RA |
| `financialStatements.ts` | Reinsurance issued/held, statements, portfolio performance |
| `reporting.ts` | LRC/LIC CSV, Excel analysis, print-to-PDF management report |

## `src/components/ui/`
49 shadcn/ui primitives (button, card, dialog, table, select, tabs, …). Generated
components — **do not hand-edit**; restyle via Tailwind and the CSS tokens in
`index.css`. See [UI_GUIDELINES.md](./UI_GUIDELINES.md).
