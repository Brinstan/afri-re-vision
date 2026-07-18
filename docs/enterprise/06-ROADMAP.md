# Phase 6 — Development Roadmap

Team assumption: 2–3 engineers + this AI pair. Sprint = 2 weeks.

## 1. MVP Scope (Release 1, "Production Foundation") — Sprints 1–7 (~14 weeks)

Everything in PRD Must-Have: engine tests, backend (identity, entities,
finance, audit), server-enforced module access, migration from localStorage,
maker-checker, period close, XLSX, backups, monitoring, deploy.

## 2. Phase 2 Scope (Release 2, "Financial Depth") — Sprints 8–11 (~8 weeks)

FX service + consolidation, notifications, report archive, yield-curve
discounting, per-risk sum-insured profiles (real surplus/exposure rating),
performance hardening, TOTP for admins.

## 3. Phase 3 Scope (Release 3, "Reach & Intelligence") — Sprints 12–15 (~8 weeks)

Cedant/broker portal (read-only statements, bordereaux upload), real ML models
per model registry, configurable risk appetite, localisation, multi-entity
groundwork.

## Sprint Plan (Release 1)

| Sprint | Goal | Key deliverables |
|---|---|---|
| S1 | Trust the maths | Vitest harness; golden tests: actuarial, IFRS 17, accounting, retro, pricing engines; CI pipeline (lint fix, typecheck, tests) |
| S2 | Identity | Fastify skeleton, users/user_modules schema, Argon2id, JWT+refresh, admin API; frontend auth wired to API |
| S3 | Core entities | Treaties/claims/underwriting/premium APIs + repositories; `src/api/` data layer behind DataStore actions |
| S4 | Migration & audit | localStorage→DB migration tool with validation report; server audit service; RLS policies |
| S5 | Finance backbone | Accounting APIs, manual journals, maker-checker workflow + approvals inbox UI |
| S6 | Close & files | Period close service + IFRS 17 opening balances; XLSX export/import; PDF reports |
| S7 | Production readiness | Staging+prod environments, backups+restore drill, monitoring/alerts, security scan pass, UAT, **go-live** |

## Release Plan & Milestones

- **M1 (end S1):** All engines under test — green baseline. 
- **M2 (end S2):** First real login against the backend.
- **M3 (end S4):** Company data lives in Postgres; audit immutable. *(Point of no return — localStorage becomes cache only.)*
- **M4 (end S6):** First period closed in-system.
- **M5 (end S7):** Production go-live. → UAT sign-off gate with CUO + Finance Manager + Actuary.
- **M6 (end S11):** Release 2 live (multi-currency close).
- **M7 (end S15):** Portal live.

## Dependencies

- S3 depends on S2 (auth) and S1 (tests protect refactors).
- Migration (S4) blocks maker-checker/close (S5–S6) — they need server data.
- Period close depends on accounting APIs; IFRS opening balances depend on close.
- Restore drill (S7) depends on backups configured (S6→S7).
- Regulator data-residency confirmation needed **before S7 hosting commit** (start inquiry in S1).

## Estimated Timeline

| Release | Duration | Calendar (from kickoff) |
|---|---|---|
| R1 Production Foundation | 14 weeks | Months 1–3.5 |
| R2 Financial Depth | 8 weeks | Months 3.5–5.5 |
| R3 Reach & Intelligence | 8 weeks | Months 5.5–7.5 |

Buffer policy: each release carries one unplanned sprint of slack before the
next begins; UAT defects burn the buffer, not the scope.
