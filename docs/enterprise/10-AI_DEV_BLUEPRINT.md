# Phase 10 — AI Development Handoff Blueprint

Hand this file (plus Phases 3, 4, 9) to any AI coding agent to build the
production backend. The frontend and engines already exist in this repo —
**the agent's job is the backend and the wiring, not a rebuild.**

## 1–2. Repository & Folder Structure (target monorepo)

```
afri-re-vision/
├── apps/
│   ├── web/                  # current src/ moves here (Vite SPA)
│   └── api/                  # Fastify modular monolith
│       ├── src/
│       │   ├── contexts/
│       │   │   ├── identity/     # auth, users, module grants
│       │   │   ├── core/         # underwriting, treaties, claims, premiums
│       │   │   ├── finance/      # accounts, journals, close, maker-checker
│       │   │   ├── actuarial/    # reserving runs (jobs)
│       │   │   ├── ifrs17/
│       │   │   ├── pricing/
│       │   │   └── retro/
│       │   ├── shared/           # audit, events(outbox), files, notify, jobs
│       │   ├── db/               # drizzle schema + migrations (Phase 4 DDL)
│       │   ├── plugins/          # auth, requireModule, rateLimit, problemJson
│       │   └── server.ts
│       └── test/                 # integration (Testcontainers)
├── packages/
│   ├── engines/              # MOVED from src/lib, src/ifrs17, src/accounting,
│   │                         # src/retrocession, src/pricing — unchanged, + tests
│   ├── contracts/            # Zod schemas shared FE/BE (entities, API IO)
│   └── access/               # src/access/permissions.ts (module catalog, templates)
├── docs/                     # existing + enterprise/
└── .github/workflows/
```

## 3. Module Breakdown

Each context exposes `routes.ts` (Fastify plugin, guarded by
`requireModule('<module>')`), `service.ts`, `repository.ts`. Domain math is
imported from `packages/engines` only. Events via outbox table:
`ClaimSettled → finance.deriveJournals + retro.recompute + notify`.

## 4. API Endpoints (v1 map)

```
POST   /auth/login | /auth/refresh | /auth/logout
GET    /me                                  # profile + granted modules

# identity (module: admin)
GET/POST        /users            PATCH /users/:id
PUT    /users/:id/modules         # grant set (validates ≥1 admin)
POST   /users/:id/password
GET    /audit?entity=&actor=&from=&to=      # audit viewer

# core
GET/POST /underwriting-contracts  POST /underwriting-contracts/:id/convert
GET/POST /treaties                PATCH /treaties/:id
GET/POST /treaties/:id/bookings   POST /bookings/:id/mark-paid
GET/POST /claims                  PATCH /claims/:id
POST   /claims/:id/submit | /approve | /reject | /settle    # maker-checker
POST   /claims/:id/documents      # multipart → object storage

# finance (module: accounting)
GET    /accounts                  GET /ledger?account=&period=
POST   /manual-journals           GET /trial-balance?period=
GET    /statements?type=&period=  GET /receivables | /payables | /bank/...
GET/POST /periods                 POST /periods/:id/close
GET    /approvals                 # pending inbox (cross-context)

# actuarial (module: actuarial)
GET/PUT /actuarial/assumptions    POST /actuarial/runs   GET /jobs/:id
GET    /actuarial/triangles?basis=&lob=

# ifrs17 / pricing / retro follow the same shape:
GET/PUT /ifrs17/assumptions       GET /ifrs17/lrc|lic|statements?date=
GET/POST /pricing/records         POST /pricing/price    POST /pricing/import
GET/POST /retro/programmes|placements|claims   POST /retro/claims/:id/settle
```
Conventions: Phase 9 §3 (Zod-validated, problem+json, Idempotency-Key on money
POSTs, 202+job for engine runs).

## 5. Database Models

Implement Phase 4 DDL verbatim in Drizzle. Non-negotiables: NUMERIC money,
append-only audit with triggers, RLS per table keyed to `app.modules`,
journal-balance and closed-period triggers, ≥1-admin invariant.

## 6. UI Components

Exist. Only additions: `src/api/` repository layer (keep DataStore action
names; swap internals to TanStack Query), Approvals inbox screen, Period-close
screen, Audit viewer screen (patterns in Phase 5 §7). Admin module already
matches the grants API shape (username/displayName/role/modules/active).

## 7–8. Development Sequence & Build Order

1. Monorepo restructure (pnpm workspaces); move engines → `packages/engines`; app builds unchanged.
2. Vitest + golden tests on engines (Phase 7 §1). **Do not proceed until green.**
3. `packages/contracts` (Zod) from existing TS interfaces in DataStore.
4. API skeleton: server, plugins (auth stub, problem+json, rate limit), healthz, CI.
5. identity context + Postgres schema + JWT; wire frontend login/admin to API.
6. core context (treaties→claims→underwriting→bookings) + audit + RLS; frontend repositories module by module (feature flag `VITE_USE_API`).
7. Migration CLI: reads `afrirevision-data` JSON export → validates → inserts → report.
8. finance context + maker-checker + approvals UI.
9. periods + close + IFRS 17 opening balances.
10. actuarial/ifrs17/pricing/retro read-services (engines run server-side as jobs for large runs; client-side remains for interactive what-ifs).
11. Files (XLSX via exceljs, PDF via playwright-print or pdfkit), documents storage.
12. Notifications; then Phase 8 production hardening checklist.

## 9. Definition of Done (every increment)

- Typecheck + lint clean; engine tests green; new logic has tests (engines 90% line coverage).
- API change: Zod schema + integration test incl. 403 matrix + audit assertion.
- DB change: migration + RLS + rollback note.
- No hardcoded palette classes; both themes verified.
- CHANGELOG + DECISIONS updated; TECH_DEBT honest.
- Deployed to Development and smoke-tested before merge to release.

## 10. Deployment Instructions

1. Provision (Terraform): managed Postgres (PITR on), Redis, object storage bucket, container app ×2 + worker, secrets (JWT keys, DB URL, SMTP).
2. `pnpm build` → Docker images `apps/api` and static `apps/web` → CDN.
3. Run migrations (`drizzle-kit migrate`) as release step; seed: module catalog + admin user (forced password change).
4. Configure: gateway rate limits, security headers, health checks, Sentry DSNs, log shipping.
5. Blue-green cutover per Phase 8 §1; verify `/healthz`, login, one mutation, audit row.
6. Enable backup alerts; schedule first restore drill within 30 days.

**Migration cutover:** freeze edits → each user exports JSON backup → run
migration CLI → validation report signed off by Finance → flip `VITE_USE_API`
→ localStorage becomes cache only.
