# Phase 8 — DevOps

## 1. CI/CD Pipeline (GitHub Actions)

```
PR opened/updated:
  lint → typecheck → unit tests (engines) → integration tests (Testcontainers)
  → build (FE+BE) → CodeQL SAST → dependency audit
  → preview deploy (ephemeral) [optional]
merge to main:
  all of the above → deploy to Development → smoke tests
tag release-candidate (rc-*):
  deploy to UAT → automated E2E → manual UAT
tag release (v*):
  deploy to Staging → k6 smoke + ZAP baseline → manual gate
  → blue-green deploy to Production → health checks → auto-rollback on failure
```

- DB migrations run as a gated step before app deploy (drizzle-kit migrate), always backward-compatible one release (expand-migrate-contract pattern).
- Secrets: GitHub environments + provider secret store; no secrets in workflows.
- Artifacts: container images tagged by git SHA; SBOM generated.

## 2. Branching Strategy

Trunk-based: `main` always deployable; short-lived feature branches (< 3 days)
→ PR → squash merge. Release tags (`v1.4.0`) cut from main. Hotfix: branch
from tag, fix, tag patch, cherry-pick to main. No long-lived develop branch.
Commit convention: Conventional Commits (feeds changelog).

## 3. Environments

| Env | Purpose | Data | Scale |
|---|---|---|---|
| Development | Continuous deploy from main | Synthetic seed | 1× API, shared small DB |
| UAT | Business acceptance | Anonymised production-shaped | 1× API |
| Staging | Prod rehearsal (perf, DAST, migration rehearsal) | Restored prod backup (masked) | Prod-shaped |
| Production | Live | Real | 2× API + worker + HA Postgres |

Config via environment variables only (12-factor); identical images across envs.

## 4. Monitoring Strategy

- Uptime: external ping on `/healthz` (1 min) + status page.
- Metrics: request rate/latency/errors per route group, job queue depth/duration, DB connections/slow queries, reserving-run duration.
- Alerts (paged): 5xx > 2% over 5 min, P95 > 1 s over 10 min, job failures, backup age > 24 h, disk > 80%, cert expiry < 14 d.
- Dashboards: per-module API health, business ops (logins, mutations, approvals pending).

## 5. Logging Strategy

- pino structured JSON: timestamp, level, request_id, user_id, module, route, latency, outcome. Request-id propagated FE→BE→DB (`application_name`).
- No PII beyond user_id; no request bodies for auth routes; no secrets ever.
- Aggregation: Grafana Loki (or provider equivalent); retention 30 d hot, 12 mo archive.
- Sentry for exceptions (FE source maps uploaded per release); errors linked to release + request_id.
- The business **audit log lives in the database** (Phase 4 §7) — operational logs are not the audit trail.
