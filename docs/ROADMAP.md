# Roadmap

## Delivered

### Stage 1 — Foundation Stabilization & Functional Completion ✅
Turned the prototype into a functional application: every interactive control wired to
the store, forms validated, dead code removed (6 unused module variants), dark mode,
and — critically — `DataStore` persistence to `localStorage`. See
[CHANGELOG.md](./CHANGELOG.md).

### Stage 2 — Enterprise Actuarial Engine ✅
Replaced the demo actuarial screen with a live reserving workbench powered by
`src/lib/actuarial.ts`: dynamic loss triangles, development factors, Chain Ladder /
Bornhuetter-Ferguson / Cape Cod / Expected Loss Ratio, simplified Mack standard errors,
inflation/trend adjustment, diagnostics, XOL analytics, portfolio analytics, charts,
and exports. Actuary-selectable preferred method.

### Stage 6B — Explainable AI Pricing & Underwriting Intelligence ✅
Explainable heuristic AI layer over 6A: risk scoring, portfolio fit, appetite
assessment, seven recommendation types (premium, retention, capacity, layers,
commission, margin, structure), renewal decision support, business-mix
optimization, and a Model Registry marking the backend-ML integration seam.
Every output discloses factors, weights, confidence, and sensitivity.

### Stage 6A — Enterprise Traditional Pricing Engine ✅
Deterministic actuarial pricing workstation on `src/pricing/`: burning cost,
experience/exposure rating, frequency–severity, ELR, credibility blending,
technical→office premium build-up, scenario modelling, validation, and
portfolio rate adequacy — all from live data. Replaces the mock AI screen.
**Stage 6B (Explainable AI augmentation) is next.**

### Stage 5 — Enterprise Retrocession Management Platform ✅
Rebuilt Retrocession on `src/retrocession/` engines: typed programmes with layers
and placements, automatic recovery calculation from live claims, retro claims
lifecycle (notify/approve/settle/dispute), counterparty security dashboard with
concentration flags, validation engine, executive analytics/reports, and full
accounting-journal integration. Removed the last illustrative in-component retro
data ([TECH_DEBT.md](./TECH_DEBT.md) item 12 resolved).

### Stage 4 — Enterprise Accounting & Financial Management Platform ✅
Rebuilt Accounting on `src/accounting/`: reinsurance chart of accounts, derived
double-entry general ledger, receivables aging, payables schedule, cash book and
bank reconciliation, multi-currency FX, trial balances, draft financial
statements, audit trail, and store-backed investments.

### Stage 3 — Enterprise IFRS 17 Reporting Engine ✅
Rebuilt IFRS 17 reporting on `src/ifrs17/*`: PAA/GMM measurement models, LRC/LIC
roll-forwards, fulfilment cash flows, configurable risk adjustment, reinsurance
issued/held, draft financial statements, roll-forwards, analytics, extensive filtering,
and CSV/Excel/PDF exports. Reuses Stage 2 actuarial IBNR.

## Direction (not yet built)

The prototype now spans the full technical lifecycle client-side. The strategic gap is
**persistence, multi-user, and real integration** — everything currently lives in one
browser. See [NEXT_STAGE.md](./NEXT_STAGE.md) for the recommended next stage and
[TECH_DEBT.md](./TECH_DEBT.md) for what to clean up along the way.

Candidate future themes (unprioritised):

- **Backend & period close** — a service to persist balances so IFRS 17 opening
  balances become real, plus real authentication and RBAC.
- **Retrocession completion** — make the retro program and allocations fully
  store-driven (some illustrative data remains).
- **Pricing engine** — turn the AI-styled pricing prototype into real rate models.
- **Reporting depth** — proper PDF/Excel generation, yield-curve discounting,
  multi-currency FX.
- **Quality** — automated tests around the pure calculation libraries; fix the ESLint
  config; code-split the >500 kB bundle.
