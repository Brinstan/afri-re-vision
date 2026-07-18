# Phase 9 — Coding Standards

Extends the existing [CODING_STANDARDS.md](../CODING_STANDARDS.md); that file
remains authoritative for the frontend patterns already in force.

## 1. Frontend

- TypeScript strict; no `any` (existing rule).
- **Pure engines** in `src/lib`, `src/ifrs17`, `src/accounting`, `src/retrocession`, `src/pricing`, `src/access` — components only render; all derivation in `useMemo` over engine calls.
- One module = one workstation component; shadcn primitives untouched in `src/components/ui/`.
- Semantic theme tokens only — hardcoded palette classes are a review-blocker; colored accents always ship light+dark pairs.
- Data access through `src/api/` repositories (DataStore action names preserved); TanStack Query for server state, Zustand for UI state.
- Accessibility: labelled inputs, no color-only meaning, keyboard paths.

## 2. Backend

- Same strict TS. Context layout: `routes/ → service/ → repository/`; domain math only from `packages/engines` — **never re-implement a calculation in a service**.
- Services own transactions and audit writes (mutation + audit in one tx).
- Zod schema per route (input+output); schemas shared with frontend via `packages/contracts`.
- Errors: typed domain errors → RFC 7807 mapping in one place; never leak stack traces.
- SOLID pragmatism: small services per use-case; repositories interface-typed for testability.

## 3. API Design

- REST `/api/v1`; nouns plural; verbs only for domain actions (`/claims/:id/settle`, `/periods/:id/close`).
- Standard responses: `200/201`, `202` for jobs (poll `/jobs/:id`), `422` validation (field-level details), `403` module denial, `409` conflict/idempotency replay.
- Cursor pagination `?cursor=&limit=` (max 200); filtering via documented query params; sparse fieldsets not used (YAGNI).
- `Idempotency-Key` required on money-moving POSTs.
- OpenAPI generated from Zod; docs published per environment.

## 4. Database

- Migrations only (no manual DDL in prod); expand-migrate-contract for zero-downtime.
- `NUMERIC` for money — never float; `timestamptz` always; UUID PKs; FKs mandatory.
- Naming: snake_case, singular column names, `_id` suffixes, `_at` timestamps, `_pct` percentages.
- Every ops table: RLS policy + created/updated audit columns; append-only audit enforced by triggers.
- No business logic in the DB beyond integrity (balance/period/admin-invariant triggers documented in Phase 4).

## 5. Security (OWASP Top 10 mapping)

| Risk | Standard |
|---|---|
| A01 Broken access control | `requireModule` middleware on every route group + RLS; authz tests in CI; IDOR: repository queries always scoped |
| A02 Crypto failures | TLS everywhere; Argon2id; no home-rolled crypto; secrets in secret store |
| A03 Injection | Parameterised queries only (ORM); Zod validation at edge; no string-built SQL |
| A04 Insecure design | This document set; threat review per epic |
| A05 Misconfig | IaC-reviewed config; security headers; prod flags locked (no debug) |
| A06 Vulnerable deps | Dependabot + audit gate in CI |
| A07 AuthN failures | Lockout, rotation, generic login errors, TOTP for admins |
| A08 Integrity | Signed images, SBOM, pinned dependencies |
| A09 Logging failures | Structured logs + audit log + alerting (Phase 8) |
| A10 SSRF | No user-supplied URLs fetched server-side; if ever needed, allow-list |

## 6. Documentation

- `/docs` is the knowledge base: CHANGELOG per release, DECISIONS.md for every consequential choice (ADR style, newest first), TECH_DEBT.md honest and current.
- Code comments only for constraints the code can't express (existing rule).
- Every API route documented via its Zod schema + one example in OpenAPI.
- Runbooks in `/docs/runbooks/`: deploy, rollback, restore, incident, break-glass admin.
