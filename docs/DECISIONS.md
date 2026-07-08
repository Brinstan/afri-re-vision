# Architecture & Design Decisions

A log of consequential decisions and their rationale, so future work doesn't
re-litigate them. Newest first.

## D-011 · Stage 5.1 — Type-specific arrangement forms and recovery bases
Each retro type captures its own terms (QS: cession % + event limit; Surplus:
max line × number of lines + estimated average cession; XOL/Cat: attachment,
limit, reinstatements, rate-on-line; Stop Loss: attachment/exhaustion loss
ratios of LIVE subject premium; Aggregate: monetary annual attachment/limit;
Facultative: linked to one inward treaty). The recovery engine allocates on the
matching basis — per-claim for per-risk types, aggregate for Stop Loss and
Aggregate (distributed back pro-rata for the register). Lines of business are
picked from the actual inward portfolio, and covered treaties are matched
automatically (LOB + period overlap), so new inward business falls into
existing covers without any manual linkage. Surplus uses an estimated average
cession because per-risk sum-insured data does not exist yet (TECH_DEBT).

## D-010 · Stage 5 — Retro programme premiums supersede treaty retroPercentage in journals
When retro programmes exist, the accounting engine derives outward premium from
programme layers (per-layer premium + override commission) and **skips** the
legacy per-treaty `retroPercentage` journal to avoid double-counting the cession.
The treaty field still drives recovery estimation on claims and IFRS 17
Reinsurance Held (see TECH_DEBT #28 for the follow-up to unify these).

## D-009 · Stage 5 — Recovery rows are derived, retro claims are stored
Recoverables are recomputed from claims × programmes on every render (like
journals); only the human lifecycle (notification, approval, settlement,
dispute) is stored as `RetroClaim` records. This keeps recovery figures always
consistent with live claim values — the spec's "update dynamically" requirement.

## D-008 · Stage 5 — Single-component module UI
The spec suggested splitting the retro UI into 8 component files. We kept one
`RetrocessionModule.tsx` (with all logic in `src/retrocession/` engines) to match
the established one-module-one-file convention of every other module. Split the
file only if it becomes hard to navigate.

## D-007 · Stage 4 — Journals are derived, not posted
Accounting entries are a pure function of operational data (plus stored manual
journals). No module posts entries explicitly, so accounting can never drift out
of sync with operations, and the ledger regenerates deterministically with
stable journal numbers (`JN-<source>-<entityId>`).

## D-006 · Stage 4 — Audit trail lives inside DataStore mutations
Every store action appends an `AuditEntry` in the same `set()` call, so audits
can't be skipped by callers. Trade-off: client-side and erasable (TECH_DEBT #24).

## D-005 · Stage 3/4 — Cross-engine reuse via persisted assumptions
IFRS 17 and Accounting read the Actuarial Engine's persisted assumptions
(`afrirevision-actuarial-assumptions`) and rerun its pure functions to get IBNR,
rather than duplicating reserving logic. The selected reserving method therefore
propagates automatically to LIC, FCF, IBNR journals, and retro reserves.

## D-004 · Stage 3 — "PDF" export = print-to-PDF window
No PDF library is installed; reports open a styled HTML window and trigger
`window.print()`. Chosen to stay dependency-free; revisit if pixel-perfect PDFs
are required.

## D-003 · Stage 2 — Calculations separated from UI
All financial/actuarial computation lives in pure modules (`src/lib/actuarial.ts`,
`src/ifrs17/`, `src/accounting/`, `src/retrocession/`); components only render.
This is the project's core standard (see CODING_STANDARDS.md) and the designated
backend seam — engines take data in and return results, so a future API can feed
them unchanged.

## D-002 · Stage 1 — Zustand persist as interim persistence
Domain data persists to localStorage under `afrirevision-data`. Accepted as a
prototype measure; replaced by a real backend in the planned persistence stage.

## D-001 · Stage 1 — DataStore is the single source of truth
All domain entities live in one Zustand store; modules derive everything else on
render. Duplicate module variants were deleted rather than maintained.
