# Phase 11 — Critical Gap Analysis

An honest, standards-based audit of AfriReVision **as it stands today** against
what an enterprise reinsurance platform requires. The system is a complete,
integrated MVP — every module functions and the calculations are real — but
"functions" and "production-grade" are different bars. Gaps are classified:

- **Severity A** — blocks production use with real money.
- **Severity B** — required for a credible enterprise deployment; workarounds exist.
- **Severity C** — enhancement; industry-standard but not blocking.

## 1. Platform & Trust Gaps

| # | Gap | Severity | Detail |
|---|---|---|---|
| G-01 | No backend persistence | A | All data in one browser's localStorage. No sharing, no durability, no concurrency. One cleared cache = lost book. |
| G-02 | Client-side security only | A | Authentication, password hashes, and module grants live in the browser and are user-editable via DevTools. Fine as UX; meaningless as security until enforced server-side (JWT + API middleware + RLS per Phase 3). |
| G-03 | No automated tests on calculation engines | A | Reserving, IFRS 17, journals, recoveries and pricing are untested code paths. For a financial system this is the single largest trust gap. |
| G-04 | Audit trail erasable | A | Audit entries sit in localStorage; any user can delete their own history. Must become append-only server data. |
| G-05 | No backup/restore for users | B | No export/import of the full dataset. Until the backend lands, a one-click JSON backup is the only safety net. |
| G-06 | No period close | B | IFRS 17 opening balances always zero; statements are inception-to-date. Regulatory quarters need frozen balances. |

## 2. Functional Gaps Within Existing Modules

| # | Gap | Severity | Detail |
|---|---|---|---|
| G-07 | No maker-checker anywhere | A | Claims payments, premium bookings, quotes and user grants are single-actor. Four-eyes approval is a baseline control in reinsurance operations. |
| G-08 | Retro cession inconsistency | B | IFRS 17 Reinsurance Held uses legacy per-treaty retro %, while accounting uses programmes (TECH_DEBT #28). Two screens can show different net figures. |
| G-09 | Reinstatement premiums not booked | B | Captured on XOL retro but never journalised (TECH_DEBT #30). |
| G-10 | No per-risk sum-insured profiles | B | Surplus cession is an estimated average; exposure rating uses a proxy curve; PML is a fixed factor. A simple risk-profile capture would make all three real. |
| G-11 | FX conversion incomplete | B | IFRS currency selector is label-only; rates are manually keyed. Multi-currency books are the norm in African reinsurance. |
| G-12 | Excel is CSV-only | B | Every "Excel" export is CSV; imports require Save-As-CSV. Finance and underwriting teams live in .xlsx. |
| G-13 | "PDF" = print dialog | C | Acceptable interim; true PDF generation needed for board/regulator packs. |
| G-14 | Discounting single-period | C | IFRS 17 uses a one-year duration assumption, not yield curves. Documented simplification. |
| G-15 | Aggregate import losses smoothed | C | Imported losses explode at average severity, understating XOL costs for skewed years (TECH_DEBT #36). |

## 3. Missing Modules (industry-standard for a reinsurance platform)

Assessed against incumbent systems (SICS, WebXL, Eclipse Re) and reinsurance
operating practice. These are **recommended additions to the roadmap**, in
priority order:

| # | Missing module | Severity | Why it matters |
|---|---|---|---|
| M-01 | **Technical Accounts / Statements of Account** | B | The quarterly account current with each cedant (premium − commission − claims ± adjustments = balance) is the core commercial document of proportional reinsurance. Today the components exist but no cedant-facing statement is produced. Recommended: Release 2. |
| M-02 | **Bordereaux management** | B | Inward premium/claims bordereaux (risk-level schedules from cedants) need structured import, validation and matching to treaties. The pricing CSV import is the seed of this; it should generalise. Recommended: Release 2. |
| M-03 | **Credit control / cash allocation** | B | Aging exists, but no dunning workflow, no allocation of unidentified receipts, no offset of balances (premium vs claims) — standard reinsurance settlement practice. Recommended: Release 2. |
| M-04 | **Regulatory returns** | B | Solvency and statutory returns (per TIRA/IRA/NAICOM formats) assembled from platform data. Today data must be exported and re-shaped by hand. Recommended: Release 2–3. |
| M-05 | **Document management** | C | Claims support docs exist as stubs; treaty wordings, slips, endorsements and correspondence need versioned storage against entities (backend object storage per Phase 3). Recommended: with backend. |
| M-06 | **Workflow inbox & notifications** | B | Approvals, renewals falling due, expiring programmes, overdue balances — users need a single "my work" view. Planned in the PRD (E8); elevated here because maker-checker (G-07) depends on it. Recommended: Release 1. |
| M-07 | **Reporting/BI layer** | C | Cross-module management reporting (combined ratio by LOB/cedant/UW year) beyond each module's analytics. Recommended: Release 3, or export-to-warehouse. |
| M-08 | **Retro reinstatement & premium adjustments** | C | Adjustable premiums (rate on turnover), profit commission and sliding-scale commission on proportional treaties are computed nowhere. Common treaty features. Recommended: Release 2. |
| M-09 | **Cedant/broker portal** | C | Already in the roadmap (Release 3). |

## 4. Compliance & Standards Gaps

| # | Gap | Severity | Standard |
|---|---|---|---|
| S-01 | No enforced RBAC server-side | A | ISO 27001 A.9 / OWASP A01 — see G-02 |
| S-02 | Password policy weak (6 chars, no lockout) | B | Raise to ≥10 + lockout at backend; current client-side is interim |
| S-03 | No data-protection features | B | PDPA/DPA: no consent records, no PII inventory, no right-to-erasure process for claimant personal data |
| S-04 | No SSDLC gates | B | ESLint broken, no CI, no SAST/dependency scanning — Phase 8 pipeline fixes all |
| S-05 | Accessibility unaudited | C | Radix gives a strong base; a WCAG 2.1 AA pass (contrast, focus order, screen-reader labels on icon buttons) has not been formally run |

## 5. What is NOT a gap (explicitly assessed as sound)

- **Architecture** — pure engines separated from UI is exactly the right seam for the backend; nothing needs rewriting.
- **Calculation breadth** — reserving (4 methods + Mack), IFRS 17 (PAA/GMM, RA, LRC/LIC), derived double-entry accounting, type-aware retro recoveries, credibility-blended pricing with explainable AI: this functional footprint already exceeds several commercial packages.
- **Integration model** — derived journals and auto-covered retro programmes eliminate whole classes of reconciliation errors by construction.
- **Access control model** — feature-based grants with role templates and admin guards is the correct design; it only needs server enforcement.
- **Documentation discipline** — CHANGELOG/DECISIONS/TECH_DEBT are current and honest.

## 6. Remediation Map

Every A-severity gap is closed by Release 1 of the roadmap (Phase 6): backend +
auth enforcement (G-01, G-02, S-01), engine tests (G-03), server audit (G-04),
maker-checker + workflow inbox (G-07, M-06), period close (G-06), XLSX (G-12),
backup (G-05 interim: JSON export ships pre-backend). B-severity items map to
Release 2 with the missing modules M-01–M-04, M-08 added to its scope.
C-severity items are logged in TECH_DEBT and scheduled opportunistically.
