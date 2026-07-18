# Phase 7 — Testing Strategy

Testing pyramid: heavy unit coverage on the pure engines (where the money is),
API integration tests, thin E2E on critical journeys.

## 1. Unit Testing Plan (Vitest)

Targets (all pure, no mocking needed):

| Package | Examples of invariants |
|---|---|
| `lib/actuarial` | Known triangle → known CL ultimates; BF with ELR=CL-implied ELR ≈ CL; factors ≥ 1 for cumulative paid; IBNR = ultimate − reported; inflation round-trips |
| `ifrs17/*` | PAA LRC roll-forward ties to earned premium; CSM never negative (loss component instead); LIC = RBNS + IBNR + RA; statements balance |
| `accounting/*` | Every derived journal balances; TB debits = credits always; FX translate round-trip; aging buckets sum to total |
| `retrocession/*` | Recovery ≤ layer limit × signed %; QS recovery = cession % × claim; stop-loss aggregate distributes pro-rata exactly; signed lines validation |
| `pricing/*` | Credibility Z∈[0,1]; office ≥ technical; burning cost of flat history = mean; layer premium monotone in limit |
| `access/permissions` | Template integrity; canAccess; hash determinism |

Coverage gate: 90% lines on engine packages; no gate on UI components.

## 2. Integration Testing Plan (API)

Testcontainers Postgres + supertest per bounded context:
- Auth: login/refresh/lockout/inactive; module claims in JWT.
- Access: 403 matrix — every route group × user without that module.
- Entities: CRUD + validation errors + audit row written per mutation.
- Maker-checker: maker cannot approve own item; state machine transitions.
- Period close: post-into-closed rejected; balances frozen match TB.
- RLS: direct SQL as restricted role sees only permitted rows.

## 3. System Testing Plan

Full-stack staging runs of the five core journeys (Phase 1 §8) with realistic
seed data (3 years, 6 LOBs, 500 claims). Includes migration rehearsal: real
(anonymised) spreadsheet data through the migration tool, validation report
reviewed by Finance.

## 4. UAT Plan

- Actors: CUO (underwriting/pricing), Claims Manager, Accountant, Actuary, Finance Manager, Admin.
- Scripted scenarios per module + free exploration week.
- Actuary gate: reserving and IFRS 17 outputs reconciled against the incumbent spreadsheet models for one historical quarter — differences explained or fixed.
- Exit: zero Sev-1/2 open; sign-off recorded.

## 5. Security Testing Plan

- SAST (CodeQL) + dependency scan (Dependabot/npm audit) every PR.
- DAST (OWASP ZAP baseline) against staging weekly.
- Authz test matrix (see §2) is part of CI, not a one-off.
- Manual checks per OWASP ASVS L2 checklist before go-live: session handling, IDOR probes on every id-bearing route, rate-limit behavior, error leakage.
- External penetration test before go-live and annually.

## 6. Performance Testing Plan

k6 against staging: 200 VU browse mix (P95 < 300 ms CRUD), reserving run on
10y×12 LOB dataset (< 10 s async job), 50-concurrent XLSX exports, login storm
(rate limiter engages, no lockout of legitimate users). Regression: k6 smoke in
CI nightly.

## 7. Test Cases (representative catalogue)

| ID | Case | Expected |
|---|---|---|
| TC-AUTH-01 | Login valid | 200 + JWT with modules |
| TC-AUTH-02 | Login wrong pw ×10 | 423 locked 15 min; audit entries |
| TC-AUTH-03 | Inactive user | 401, generic message |
| TC-ACC-01 | User w/o `accounting` calls GET /accounting/trial-balance | 403 |
| TC-ACC-02 | Admin revokes module mid-session | Next request 403; nav updates on refresh |
| TC-ADM-01 | Deactivate last admin | Rejected with named error |
| TC-CLM-01 | Claim loss date outside treaty period | 422 with field error |
| TC-CLM-02 | Settle approved claim | Journal derived, retro recovery computed, notification sent |
| TC-MC-01 | Maker approves own booking | 403 |
| TC-CLOSE-01 | Manual journal into closed period | 422 |
| TC-CLOSE-02 | Close then reopen Q, opening balances | Q+1 opening = Q closing exactly |
| TC-RET-01 | Bind placement at 95% signed | 422 names 5% gap |
| TC-ENG-01 | Golden triangle CL | Ultimates match worked example to 0.01 |
| TC-MIG-01 | Migration of seed localStorage export | Row counts match; validation report clean |
| TC-BCK-01 | Restore drill | RTO < 4 h achieved, checksums match |
