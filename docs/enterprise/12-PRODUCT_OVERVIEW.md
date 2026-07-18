# AfriReVision — Product Overview

*The document to hand a new user, a stakeholder, or a testing agent. It
explains what the product is, what each module does, who sees what, and how
the core workflows run end-to-end.*

## What AfriReVision Is

AfriReVision is an integrated management platform for a reinsurance company.
It administers the entire technical lifecycle in one system: business is
underwritten, becomes treaties, attracts premium and claims, is reserved by
actuaries, priced at renewal, protected by retrocession, accounted for in a
double-entry ledger, and reported under IFRS 17 — with every figure computed
by the platform and every change recorded in an audit trail.

**The one-sentence pitch:** every contract, claim, cession and cent flows
through one governed platform, and every number can explain itself.

## Signing In & Access

- Users sign in with a username and password issued by the **System Administrator**.
- Access is **feature-based**: the administrator grants each user specific
  modules. You only see what you have been granted — an underwriter typically
  sees Underwriting, Pricing, Treaties and Retrocession; an accountant sees
  Accounting; the actuary sees Actuarial, Pricing and IFRS 17.
- Role templates (Underwriter, Claims Officer, Accountant, Actuary, Finance
  Manager, Executive) pre-fill sensible grants; the administrator can tailor
  each user individually and view the full access matrix.
- First-run credential: `admin / admin123` — change it immediately under
  Administration.

## The Ten Modules

1. **Dashboard** — live KPIs (premium volume, outstanding claims, reserves), quick actions into the modules you hold, alerts, and portfolio counts.
2. **Underwriting** — capture inward business: cedant, broker, type (quota share, surplus, XOL, stop loss, facultative), line of business, period, premium, commission, layers. Validated, duplicate-checked, and converted into a live treaty in one click.
3. **Treaties** — the register of in-force business. Book premium by period, track payment status, record monthly returns, search and export.
4. **Claims** — register claims against treaties (the system checks the loss date falls in the treaty period), allocate across layers, hold reserves, pay, and attach references. Settled claims automatically drive accounting entries and retrocession recoveries.
5. **Actuarial Engine** — builds paid/incurred/reported triangles from live claims, computes development factors, and runs Chain Ladder, Bornhuetter-Ferguson, Cape Cod and Expected Loss Ratio with Mack standard errors. The actuary selects the preferred method — that choice drives IBNR everywhere else in the platform.
6. **Pricing** — prices a proposed treaty using burning cost, experience rating, exposure rating, frequency-severity and a credibility blend; builds up technical → office premium; stress scenarios; imports historical experience files; recalls a cedant's past data by name or contract number. An **AI Advisor** adds risk scoring, premium/retention/commission recommendations, renewal decisions and portfolio-mix suggestions — every recommendation shows its factors, weights, confidence and sensitivity (no black boxes).
7. **Retrocession** — outward protection. Programmes are typed (QS, Surplus, XOL, Cat, Stop Loss, Aggregate, Facultative) with type-specific forms; each programme covers its lines of business **automatically** — any inward treaty on those lines and period falls under the cover with no manual linking. Recoveries compute from live claims; placements must sign to exactly 100%; counterparty security and concentration are monitored.
8. **Accounting** — a reinsurance chart of accounts and a general ledger **derived** from operations: premium bookings, claims, commissions, retro premiums and recoveries become balanced journals automatically; finance never re-keys operational data. Receivables aging, payables, cash book, bank reconciliation, investments, multi-currency FX, trial balance and draft financial statements.
9. **IFRS 17** — measurement (PAA for short coverage, GMM otherwise), LRC and LIC roll-forwards, risk adjustment (three methods), fulfilment cash flows, reinsurance held/issued, and draft statements — reusing the actuary's selected IBNR, filterable by date, cedant, LOB, currency and more.
10. **Administration** — user accounts, module grants, access matrix, password management, activate/deactivate. Guard rails: at least one active administrator always; no self-lockout.

## How the Modules Interlock (the point of the product)

- Underwriting contract → **becomes** treaty → **generates** receivable.
- Claim → **checks** treaty cover → **drives** reserve, journal, and retro recovery.
- Actuary's method selection → **feeds** IFRS 17 LIC, IBNR journals, retro reserves.
- Retro programme → **auto-covers** matching inward treaties → recoveries and outward journals flow.
- Every mutation → **audit trail**.

Nothing is re-keyed between modules; disagreement between screens is treated
as a defect, not a reconciliation task.

## For the Testing Agent

- **Entry:** sign in as `admin / admin123` (or create test users per role and verify each sees only granted modules — the access matrix in Administration is ground truth).
- **Seed data:** the app ships with sample treaties/claims; Settings → Reset Data restores it. User accounts survive a data reset.
- **Core assertions:** trial balance always balances; a claim outside a treaty period is rejected; retro placements cannot bind ≠100%; the selected actuarial method changes IBNR in IFRS 17 and accounting consistently; revoking a module removes it from navigation and content; the last administrator cannot be deactivated.
- **Full test catalogue:** Phase 7 (Testing Strategy) — unit invariants for every engine, integration matrices, and the UAT scripts.
- **Known limitations while client-side:** data is per-browser (localStorage); security is UX-level until the backend (see Phase 11 Gap Analysis, Severity A items).

## Where the Product Is Going

The platform is a complete MVP today. The production programme (Phases 1–10)
adds, in order: engine test suites → real backend with server-enforced access
and immutable audit → maker-checker approvals → period close → true
Excel/PDF → multi-currency close → technical accounts, bordereaux and credit
control → cedant portal and real ML pricing models. The full plan, sprint by
sprint, is Phase 6 (Roadmap); the honest gap list is Phase 11.
