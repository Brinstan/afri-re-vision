# Phase 3 — System Architecture

Design principle: **evolve, don't rewrite.** The existing frontend and pure
calculation engines are correct-by-construction seams; the backend slots in
behind them. Clean Architecture: engines = domain layer (already pure),
API = application layer, DB = infrastructure. A **modular monolith** is chosen
over microservices — one team, one deployable, strong transactional needs
(journals, close); DDD module boundaries keep a later split possible.

## 1. Architecture Diagram

```
                        ┌────────────────────────────┐
   Browser (React SPA)  │  CDN + WAF (static assets) │
        │ HTTPS         └────────────────────────────┘
        ▼
┌──────────────────────────────────────────────────────────────┐
│  API Gateway / Reverse proxy (TLS, rate limit, compression)  │
└──────────────────────────────────────────────────────────────┘
        │
┌──────────────────────────────────────────────────────────────┐
│  AfriReVision API (Node/TS modular monolith)                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ identity│ │ core    │ │ finance  │ │ actuarial/ifrs17 │   │
│  │ &access │ │ (uw/    │ │ (gl/ar/  │ │ /pricing/retro   │   │
│  │         │ │ treaty/ │ │ ap/close)│ │ (reuse TS engines│   │
│  │         │ │ claims) │ │          │ │  from src/)      │   │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────────┘   │
│        shared kernel: audit, events, files, notifications    │
└──────────────────────────────────────────────────────────────┘
   │            │             │              │
   ▼            ▼             ▼              ▼
PostgreSQL   Redis        S3-compatible   Email/SMS
(+ RLS)     (cache/rate)  object storage  provider
   │
Backups → PITR + nightly snapshots (offsite)
```

## 2. Technology Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TS + shadcn/Tailwind + Zustand | Exists; proven |
| Backend | Node.js 20 + TypeScript + Fastify + Zod | **Reuses the TS calculation engines unchanged** — the decisive argument; Zod schemas shared FE/BE |
| ORM | Drizzle (or Prisma) | Type-safe schema shared with domain types |
| DB | PostgreSQL 16 | ACID for journals/close, RLS, JSONB for flexible terms |
| Cache/queues | Redis | Sessions optional, rate limiting, BullMQ jobs |
| Files | S3-compatible (R2/S3/MinIO) | Claim documents, report archive |
| Auth | JWT access (15 min) + rotating refresh (7 d), Argon2id hashes | Standard; see §7 |
| Hosting | Managed containers (Fly.io/Render/Railway) or AWS ECS; managed Postgres (Neon/RDS) | Small team → managed services |
| CI/CD | GitHub Actions | Repo already on GitHub |
| Monitoring | Sentry + Grafana Cloud (or provider equivalents) | Error + metrics + logs |

Alternative considered: Supabase (fastest path — Postgres + auth + RLS + storage
in one). Acceptable for MVP; the custom Fastify API is preferred because
reserving/IFRS runs and derived journals are server-side compute, not CRUD.

## 3. Frontend Architecture

- Keep module-per-file components + pure engine libraries (CODING_STANDARDS.md).
- Introduce a **data-access layer** `src/api/` exposing the exact DataStore
  action surface (`addTreaty`, `addClaim`, …) backed by fetch + TanStack Query
  (already installed); Zustand keeps UI state. Modules don't change.
- Route-level code-splitting per module (fixes bundle warning).
- Session: access token in memory, refresh via httpOnly cookie.

## 4. Backend Architecture

- Modular monolith, DDD bounded contexts: `identity`, `core` (uw/treaty/claims),
  `finance`, `actuarial`, `ifrs17`, `pricing`, `retro`, shared kernel
  (`audit`, `events`, `files`, `notify`).
- Each context: routes → service (use-cases) → repository; domain math imported
  from the existing engine packages (extracted to `packages/engines`).
- Domain events (in-process, outbox table) — e.g. `ClaimSettled` triggers retro
  recovery recompute + journal derivation + notification.
- Jobs (BullMQ): reserving runs, statement generation, imports, emails.

## 5. Database Architecture

PostgreSQL, 3 schema groups: `identity`, `ops` (business entities), `audit`.
Full design in Phase 4. Key decisions: monetary values `NUMERIC(18,2)`;
type-specific treaty/retro terms in typed columns + `JSONB extras`; audit
append-only with trigger-enforced immutability; RLS on every table keyed to
granted modules (defence in depth behind API checks).

## 6. API Architecture

REST, `/api/v1`, JSON, Zod-validated. Conventions: plural resources, nested
subresources one level max, cursor pagination, `Idempotency-Key` on POSTs that
move money, RFC 7807 problem+json errors. Endpoint map in Phase 10. Versioning
via URL; breaking changes → v2. OpenAPI generated from Zod schemas.

## 7. Authentication & Authorization Design

- Login → Argon2id verify → access JWT (15 min; claims: `sub`, `role`,
  `modules[]`) + rotating refresh token (httpOnly, Secure, SameSite=strict).
- **Feature-based access control** (as implemented in the frontend today):
  administrators grant module ids per user; role templates are starting points.
  Enforcement in three layers: UI (hide), API middleware (`requireModule('accounting')`
  per route group), DB RLS (session variable `app.modules`).
- Guarantees: ≥1 active administrator invariant enforced in the service layer;
  self-lockout prevented; password policy (min 10 in production, breach-list
  check), Argon2id, per-user salt; account lockout after 10 failures (15 min);
  optional TOTP 2FA for administrators (Should-Have).
- All privileged actions (grants, password resets, deactivation) audited.

## 8. Security Design (OWASP / ISO 27001 / NIST CSF mapping)

- **Identify:** asset register = this doc set; data classification (PII: users, claimants; financial: all).
- **Protect:** TLS 1.2+; headers (CSP, HSTS, X-Frame-Options); input validation at the edge (Zod); parameterised queries only; secrets in platform secret store, never in git; least-privilege DB roles; dependency scanning (npm audit + Dependabot); SAST (CodeQL) in CI.
- **Detect:** structured auth/audit logs, anomaly alerts (failed logins, mass exports).
- **Respond/Recover:** incident runbook, breach-notification procedure (PDPA/DPA timelines), DR plan §12.
- OWASP Top 10 addressed explicitly in Phase 9 §5 (coding standards).

## 9. Integration Design

Near-term integrations are file-based (bordereaux XLSX import, statement
exports). Design leaves seams: outbound webhooks on domain events; inbound
`/api/v1/imports` with schema-validated payloads; FX rates provider adapter
(Release 2); email provider adapter. No ESB — YAGNI.

## 10. Notification Design

Notification service (shared kernel): domain events → notification rules →
channels (in-app inbox table + email). MVP events: approval requested/decided,
claim settled, placement unbound (<100%), premium overdue, treaty expiring
60/30 days, backup failure. User-level preferences later.

## 11. Logging & Monitoring Design

- Structured JSON logs (pino) with request id + user id; no PII/secrets in logs.
- Error tracking: Sentry (FE + BE) with release tagging.
- Metrics: request latency/error rate, job durations, DB pool, reserving-run time.
- Dashboards + alerts: P95 latency, 5xx rate, failed jobs, backup age, cert expiry.
- Audit log is business data (DB), not operational logging.

## 12. Disaster Recovery Design

- RPO ≤ 15 min (WAL/PITR), RTO ≤ 4 h.
- Runbook: restore latest snapshot + WAL to new instance → repoint API → smoke tests → DNS.
- Quarterly restore drills (tested backup = backup).
- Region failure: infra-as-code (Terraform) recreates the stack in an alternate region; object storage cross-region replicated.

## 13. Backup Strategy

- DB: continuous WAL archiving + nightly full snapshot; retention 35 days + monthly for 12 months (financial data ≥ 10 yrs via yearly archives).
- Object storage: versioning + replication.
- Config/secrets: infra-as-code in git; secret store backups per provider.
- Application-level: existing JSON export retained as user-facing safety net.

## 14. Scalability Design

- Stateless API → horizontal scale behind LB; sticky sessions unnecessary (JWT).
- Postgres: primary + read replica when needed; heavy analytics reads → replica.
- Jobs isolated in worker process — reserving runs can't starve the API.
- Realistic load (hundreds of users, not millions) — vertical headroom is cheap; design avoids anything that *prevents* horizontal scale.

## 15. Performance Optimization Strategy

- DB: indexes per Phase 4; keyset pagination; materialised views for triangle source aggregation if needed.
- API: Redis cache for reference data (CoA, FX) with event-driven invalidation; gzip/brotli.
- FE: code-splitting, memoised selectors (already), virtualised large tables.
- Budget: P95 API < 300 ms for CRUD; engine runs async via jobs with progress.

---

## The 13 Production Layers (explicit mapping)

| # | Layer | Implementation |
|---|---|---|
| 1 | Frontend foundation | React 18 + Vite + TS + shadcn/Tailwind + Zustand + TanStack Query; code-split modules; WCAG AA |
| 2 | API & backend logic | Fastify modular monolith; DDD contexts; engines reused from `packages/engines`; BullMQ jobs |
| 3 | Database & storage | PostgreSQL 16 (NUMERIC money, JSONB terms); S3-compatible object storage for documents/reports |
| 4 | Authentication & permission | Argon2id + JWT/refresh rotation; admin-granted module access; role templates; ≥1-admin invariant; optional TOTP |
| 5 | Hosting & deployment | Managed containers (Fly/Render/ECS); managed Postgres; IaC (Terraform); blue-green deploys |
| 6 | Cloud & compute | 2× API instances (prod), 1× worker, Redis, Postgres primary(+replica); dev/UAT/staging scaled down |
| 7 | CI/CD & version control | GitHub; trunk-based with short-lived branches; Actions: lint→typecheck→test→build→scan→deploy; environments gated |
| 8 | Security & row-level security | OWASP ASVS L2; Postgres RLS keyed to `app.user_id`/`app.modules` on every ops table; audit append-only triggers |
| 9 | Rate limiting | Gateway: 300 req/min/IP; API: per-user token bucket (Redis), stricter on `/auth/*` (10/min) and exports |
| 10 | Caching & CDN | CDN for SPA assets (immutable, hashed); Redis for reference data + idempotency keys; ETag on GET |
| 11 | Load balancing & scaling | Platform LB, health checks `/healthz` `/readyz`; HPA on CPU/latency; stateless API |
| 12 | Error tracking & logs | Sentry FE/BE; pino JSON logs → aggregated (Grafana Loki); request-id correlation |
| 13 | Availability & recovery | Multi-instance API, managed DB HA, PITR backups, DR runbook + quarterly drills, uptime SLO 99.5% with status page |
