# Phase 2 — Product Requirements Document (PRD)

## 1. Product Overview

AfriReVision is an integrated reinsurance management platform covering the full
technical lifecycle: underwriting → treaties → claims → actuarial → pricing →
retrocession → accounting → IFRS 17, governed by feature-based access control.
The frontend and calculation engines are built; this PRD covers the complete
product including the production backend.

## 2. Product Goals

1. One governed source of truth for all reinsurance operations.
2. Every financial figure computed by an engine, explained, and auditable.
3. Least-privilege access: users see only the modules an administrator grants.
4. Close the books from live data, not reconstructed spreadsheets.

## 3. Features List (by module)

- **Administration** — user accounts, role templates, per-user module grants, access matrix, password management, audit log viewer.
- **Underwriting** — contract capture (all treaty types/LOBs), validation, duplicate prevention, conversion to treaty.
- **Treaties** — register, premium bookings, monthly returns, payment tracking, search, CSV export.
- **Claims** — registration with treaty auto-link, layer allocation, reserves, payment, documents, references.
- **Actuarial** — triangles (paid/incurred/reported), dev factors, CL/BF/Cape Cod/ELR, Mack SE, inflation, diagnostics, method selection (governed), XOL & portfolio analytics.
- **Pricing** — six arrangement types, five methods + credibility blend, premium build-up, scenarios, validation, external experience import, cedant recall, rate adequacy; explainable AI advisor (risk score, recommendations, renewal support, mix optimisation, model registry).
- **Retrocession** — typed programmes with type-specific forms, LOB auto-coverage, layers, placements (=100%), recoveries engine, retro claims lifecycle, counterparty security, analytics, validation.
- **Accounting** — CoA, derived GL, manual journals, AR aging, AP schedule, cash book, bank reconciliation, investments, multi-currency FX, TB, statements, audit trail.
- **IFRS 17** — PAA/GMM, LRC/LIC roll-forwards, risk adjustment (3 methods), FCF, reinsurance issued/held, statements, filters, exports.
- **Platform** — dark/light theme, exports, persisted assumptions, seed/reset (dev), backup/restore.

## 4. Feature Prioritization (MoSCoW, production programme)

**Must Have (MVP / Release 1)**
- Backend persistence (all current entities) with API parity to DataStore actions
- Real authentication (JWT + refresh) and server-enforced module access (current admin UI backed by API)
- Audit trail server-side, immutable
- Unit tests on all calculation engines
- Backup/restore + automated DB backups
- Period close (freeze balances; IFRS 17 opening balances)
- Maker-checker on claim payments and premium bookings
- XLSX export/import (replace CSV-only)

**Should Have (Release 2)**
- FX rates service + full multi-currency consolidation
- Notifications (in-app + email: approvals, overdue, renewals)
- Report archive (immutable statements per valuation date)
- Yield-curve discounting for IFRS 17
- Per-risk sum-insured profiles (real surplus cession & exposure curves)
- Code-splitting, performance hardening

**Could Have (Release 3)**
- Cedant/broker portal (statements, bordereaux upload)
- Real ML models per the Stage 6B model registry
- Configurable risk-appetite statements
- Multi-entity / multi-book consolidation
- sw-TZ localisation

**Won't Have (this programme)**
- Life reassurance measurement (VFA full implementation)
- Direct insurance policy administration
- Bureau/EDI integrations (SICS/Xchanging)

## 5. Acceptance Criteria (samples; full set lives with each story)

- **Auth:** given an inactive account, login is rejected; given a valid login, a JWT with the user's granted modules is issued; expired tokens force re-auth.
- **Access:** a user without `accounting` receives 403 from every `/accounting/*` endpoint and never sees the module in navigation.
- **Claims:** a claim on a treaty whose period does not cover the loss date is rejected with a specific validation message.
- **Retro:** binding a placement where signed lines ≠ 100% is impossible; the validation names the gap.
- **Close:** after closing 2026-Q3, posting into it fails; IFRS 17 Q4 opening balances equal Q3 closing.
- **Audit:** every mutation writes actor, timestamp, entity, before/after; audit records cannot be updated or deleted via any API.

## 6. User Stories (representative)

- As a **System Administrator**, I create a user from the "Underwriter" template and untick Retrocession, so the user sees exactly 4 modules.
- As an **Underwriter**, I price a renewal by contract number so prior-year experience loads automatically.
- As a **Claims Officer**, I settle an approved claim and the payment journal and retro recovery are created without my involvement.
- As an **Actuary**, I select Bornhuetter-Ferguson as the preferred method and see LIC, IBNR journals and retro reserves update.
- As a **Finance Manager**, I approve a payment batch a colleague prepared (maker-checker).
- As an **Accountant**, I reconcile the bank statement and unmatched items are listed with aging.

## 7. Epics

| Epic | Contents |
|---|---|
| E1 Identity & Access | Auth service, JWT, module grants API, admin UI wiring, session mgmt |
| E2 Core Data Services | Treaties/claims/underwriting/premium APIs + migration from localStorage |
| E3 Financial Backbone | Accounting APIs, period close, maker-checker, manual journals |
| E4 Actuarial & IFRS 17 Services | Server-run engines, assumption governance, report archive |
| E5 Retro & Pricing Services | Programmes, recoveries, pricing records, external data |
| E6 Quality & Trust | Engine unit tests, E2E tests, audit immutability, backups |
| E7 Reporting & Files | XLSX/PDF generation, imports, document storage |
| E8 Notifications | In-app + email events |
| E9 Platform Ops | CI/CD, environments, monitoring, DR (Phase 8 doc) |

## 8. Product Backlog (ordered)

1. E6: engine unit-test harness (Vitest) + golden tests for actuarial/IFRS 17/accounting/retro/pricing
2. E1: auth service + users/grants schema + login/refresh + admin API
3. E2: entity APIs with DataStore-shaped actions; repository layer in frontend
4. E2: data migration tool (localStorage JSON → DB) with validation report
5. E3: audit service (server), wire all mutations
6. E3: maker-checker workflow (claims payments, premium bookings)
7. E3: period close service + IFRS 17 opening balances
8. E7: XLSX export/import; PDF reports
9. E6: backups + restore runbook; E9 monitoring
10. E8: notification service
11. Release 2 backlog: FX service, report archive, yield curves, risk profiles
