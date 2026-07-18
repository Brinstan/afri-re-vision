# Phase 1 — Business Analysis

*AfriReVision — Enterprise Reinsurance Management Platform.*
*Prepared per BABOK v3 practice; feeds the PRD (Phase 2).*

## 1. Executive Summary

AfriReVision digitises the full technical lifecycle of a reinsurance company —
underwriting, treaty administration, claims, actuarial reserving, pricing,
retrocession, accounting, and IFRS 17 reporting — in one integrated platform.
A fully functional client-side implementation already exists (React/TypeScript,
9 modules, pure calculation engines, admin-managed feature access). This
programme takes it to production: a secure multi-user backend, real
persistence, enforced role-based access, and regulated-grade controls.

## 2. Problem Statement

African reinsurers predominantly run on spreadsheets and disconnected legacy
systems. Consequences:

- Premium/claims data re-keyed between underwriting, claims, and finance — errors and delay.
- Reserving and IFRS 17 measurement done quarterly in ad-hoc models with no audit trail.
- Retrocession recoveries missed because outward covers are not linked to inward claims.
- No single view of exposure, counterparty concentration, or rate adequacy.
- Regulator submissions (solvency, IFRS 17) assembled manually under deadline pressure.

## 3. Business Case

| Benefit | Mechanism |
|---|---|
| Reduce operational cost | Eliminate re-keying; derived accounting means finance never reconciles to operations |
| Reduce leakage | Automatic retro recovery identification on every claim |
| Faster close | IFRS 17 and statements generated from live data, not rebuilt |
| Better pricing | Credibility-blended actuarial pricing + explainable AI advisory on every quote |
| Compliance | Complete audit trail, maker-checker, enforced access control |

Build-vs-buy: incumbent packages (SICS, WebXL, etc.) are costly, heavy to
localise (currencies, LOB mix, IFRS 17 PAA practice) and overshoot small/mid
African reinsurers. A tailored platform with a modern stack is cheaper over 5
years and owns its roadmap.

## 4. Project Vision

> The operating system for an African reinsurer: every contract, claim, cession
> and cent flows through one governed platform, and every figure — reserve,
> price, journal, disclosure — is computed, explained, and auditable.

## 5. Success Criteria

1. 100% of inward business and claims administered in the platform (no shadow spreadsheets) within 6 months of go-live.
2. Monthly close ≤ 5 working days; IFRS 17 quarterly pack produced from the system.
3. Zero claims settled without retro recovery evaluation.
4. All users on least-privilege module access; every mutation in the audit trail.
5. 99.5% availability during business hours; RPO ≤ 15 min, RTO ≤ 4 h.

## 6. Stakeholder Analysis

| Stakeholder | Interest | Influence | Engagement |
|---|---|---|---|
| Managing Director / Board | Portfolio performance, solvency | High | Monthly steering |
| Chief Underwriting Officer | Underwriting & pricing workflow | High | Product owner (business) |
| Finance Manager | GL integrity, close, statements | High | Sprint reviews |
| Chief Actuary | Reserving & IFRS 17 correctness | High | Method sign-off gates |
| Claims Manager | Claims lifecycle, recoveries | Medium | Sprint reviews |
| IT / System Administrator | Operability, access management | Medium | DevOps counterpart |
| Regulator (e.g. TIRA/IRA/NAICOM) | Solvency & IFRS 17 reporting | High (indirect) | Compliance requirements |
| Cedants & brokers | Statements, settlements | Low | Outputs only (Phase 3 portal) |
| Retrocessionaires | Placement data, recoveries | Low | Outputs only |

## 7. User Personas

1. **Amina — Underwriter.** Captures inward contracts, prices treaties, negotiates terms. Needs: fast capture, pricing with defensible numbers, treaty view. Modules: Underwriting, Pricing, Treaties, Retrocession.
2. **Joseph — Claims Officer.** Registers and settles claims, tracks recoveries. Needs: treaty auto-linking, layer allocation, settlement workflow. Modules: Claims, Treaties.
3. **Grace — Accountant.** Books cash, reconciles bank, produces TB and statements. Needs: derived journals, receivables aging, multi-currency. Modules: Accounting, Treaties.
4. **Daniel — Actuary.** Quarterly reserving, IFRS 17 measurement, pricing review. Needs: triangles, method comparison, assumption governance. Modules: Actuarial, Pricing, IFRS 17.
5. **Neema — Finance Manager.** Close, statements, retro security. Modules: Accounting, IFRS 17, Retrocession, Treaties.
6. **Ibrahim — System Administrator.** Creates accounts, grants module access, monitors audit log. Modules: Administration (+all for support).
7. **The MD.** Read-oriented executive view across all modules.

## 8. User Journey Mapping (core journeys)

1. **Inward contract → treaty:** Amina captures contract → validates terms → converts to treaty → premium schedule created → Grace sees receivable automatically.
2. **Claim lifecycle:** Joseph registers claim vs treaty → layer allocation computed → reserve booked → retro recovery computed across programmes → settlement → journals derived → recovery notified to retrocessionaire.
3. **Quarterly close:** Daniel locks triangles → selects method → IBNR flows to LIC and journals → Neema runs TB and statements → IFRS 17 pack exported → period closed (balances frozen).
4. **Pricing a renewal:** Amina recalls cedant history (incl. imported experience) → runs methods → reviews AI advisory → issues quote → decision recorded.
5. **Access grant:** Ibrahim creates user from role template → tailors modules → user sees only granted features.

## 9. Functional Requirements (summary; full catalogue in PRD)

- FR-1 Underwriting capture & conversion to treaties (proportional & non-proportional, all LOBs).
- FR-2 Treaty administration: premium bookings, monthly returns, payment status.
- FR-3 Claims: registration, treaty linkage, layer allocation, payment, documents.
- FR-4 Actuarial: triangles, CL/BF/Cape Cod/ELR, Mack SE, method selection, diagnostics.
- FR-5 Pricing: experience/exposure/frequency-severity/credibility, scenarios, external data import, explainable AI advisory.
- FR-6 Retrocession: typed programmes, auto-covered treaties by LOB, placements =100%, recoveries, counterparty security.
- FR-7 Accounting: CoA, derived double-entry GL, AR/AP, cash book & reconciliation, multi-currency, TB, statements.
- FR-8 IFRS 17: PAA/GMM, LRC/LIC, RA, FCF, disclosures.
- FR-9 Administration: user accounts, feature-based module access granted by administrator, audit trail.
- FR-10 Reporting/exports throughout (CSV/XLSX/PDF).

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | 99.5% business hours; graceful degradation |
| Performance | Screen loads < 2 s at P95; reserving run on 10 yrs × 12 LOBs < 10 s |
| Scalability | 200 concurrent users; 1M claims rows without redesign |
| Security | OWASP ASVS L2; ISO 27001-aligned controls; RBAC + RLS |
| Auditability | Every mutation logged (who/what/when/before/after), immutable |
| Data retention | Financial records ≥ 10 years |
| Usability | WCAG 2.1 AA; dark mode; keyboard navigable |
| Localisation | Multi-currency (7+), en-US initially; sw-TZ ready |
| Recoverability | RPO ≤ 15 min, RTO ≤ 4 h |

## 11. Business Rules (selected)

- BR-1 A treaty must originate from an approved underwriting contract or explicit manual entry with reason.
- BR-2 A claim must reference an in-force treaty covering the loss date and LOB.
- BR-3 Signed retro lines per layer must total exactly 100% before a placement is bound.
- BR-4 Journals are **derived**, never hand-posted, except governed manual journals (balanced, referenced).
- BR-5 The selected reserving method drives IBNR everywhere (LIC, journals, retro reserves) — one source of truth.
- BR-6 Retro programmes auto-cover all inward treaties matching LOB + period; no manual linkage.
- BR-7 Access to a module exists only if granted by an administrator; at least one active administrator must always exist.
- BR-8 A closed accounting period is immutable; corrections post into the open period.
- BR-9 Money-moving actions (claim payment, premium booking confirmation, quote issue) require maker-checker approval (backend phase).

## 12. Assumptions

- Single legal entity, single book initially (no multi-entity consolidation in MVP).
- Users are internal staff; cedant/broker portal deferred to Phase 3.
- English UI acceptable at launch.
- Cloud hosting permitted by the regulator (with data residency verified per country).

## 13. Constraints

- Existing React/TS/shadcn frontend and pure calc engines are the baseline — evolve, don't rewrite.
- Small team; managed cloud services preferred over self-hosted infrastructure.
- IFRS 17 effective — no parallel IFRS 4 requirement.

## 14. Risks

| Risk | L | I | Mitigation |
|---|---|---|---|
| Calculation defects in reserving/IFRS 17 | M | High | Unit tests vs worked examples; actuary sign-off gate |
| Data migration from spreadsheets dirty | H | M | Migration tooling with validation reports; parallel run 1 quarter |
| Scope creep (portal, multi-entity) | H | M | MoSCoW discipline; change control |
| Single-admin lockout | L | H | Enforced ≥1 active admin; break-glass procedure |
| Cloud/regulator data-residency conflict | L | H | Confirm residency before hosting choice; region pinning |
| Key-person dependency (one dev team) | M | M | This documentation set; CI-enforced standards |

## 15. Regulatory & Compliance Requirements

- **IFRS 17** — measurement & disclosure (engine exists; period close required for opening balances).
- **Insurance regulators** (TIRA Tanzania / IRA Kenya / NAICOM Nigeria, per market) — solvency returns, statutory reporting; system must export the underlying data.
- **Data protection** — Tanzania PDPA 2022 / Kenya DPA 2019 / GDPR-alignment for any EU cedants: lawful basis, breach notification, data subject rights over personal data held (users, claimants where individuals).
- **ISO 27001 / NIST CSF** — control framework for the SSDLC and operations (see Phase 3 §8 and Phase 8).
- **OWASP ASVS L2** — application security verification target.
