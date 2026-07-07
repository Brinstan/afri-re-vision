# Coding Standards

Conventions distilled from the Stage 1–3 work. Follow them so the codebase stays
consistent and reviewable.

## Golden rule: separate calculations from UI

Business/financial computation belongs in **pure functions** in a dedicated module,
not inside a component:

- Actuarial → `src/lib/actuarial.ts`
- IFRS 17 → `src/ifrs17/*`

Components import these, wrap them in `useMemo`, and render. Pure functions must be
side-effect free (no store access, no DOM, no `localStorage`) — pass data in, return
data out. This keeps them testable and reusable (IFRS 17 reuses actuarial outputs
precisely because they are pure).

## State

- **Domain data** goes in `DataStore` (Zustand). Never duplicate treaties/claims into
  component state; read via `useDataStore()` and mutate via its actions.
- **Ephemeral UI state** (open dialogs, form fields, active tab) is local `useState`.
- **Assumptions** that must survive reloads persist to a namespaced `localStorage` key
  (`afrirevision-*`) — mirror the pattern in `ifrs17/assumptions.ts`.
- Derive, don't store: computed values (KPIs, reserves, ratios) are derived on render
  via `useMemo`, not written back into the store.

## TypeScript

- `strict` is on and the build must be `tsc --noEmit` clean before commit.
- Export and reuse the shared domain types (`Treaty`, `Claim`, `PremiumBooking`) from
  `DataStore.tsx`; don't redefine them.
- Avoid `any`. Stage 1 replaced loose `any` with `PremiumBooking`/`LayerAllocation`.
  Where a shape is genuinely dynamic (e.g. underwriting `terms`), use
  `Record<string, string>` or a narrow union, not `any`.
- Prefer discriminated unions and `as const` for enums-in-strings (statuses, methods).

## React

- Functional components with hooks only.
- Key expensive derivations with `useMemo`, listing exact dependencies.
- Controlled inputs: bind `value` + `onChange`. (Stage 1 fixed many uncontrolled
  inputs that silently dropped data — do not reintroduce them.)
- Every interactive control must do something real — no empty `onClick`, no
  `console.log`-only handlers, no placeholder buttons. This was an explicit Stage 1
  cleanup and is a review gate.

## Validation & user feedback

- Validate before mutating the store; show a `toast.error` with a specific message.
- Confirm success with `toast.success` naming what happened.
- Guard against duplicates (e.g. unique contract numbers) and invalid ranges (dates,
  positive amounts) at the form boundary.
- Use `<AlertDialog>` for irreversible actions.

## Files & naming

- One module per file in `src/components/`; PascalCase component and file names.
- Pure helpers in `src/lib/` or `src/ifrs17/`; camelCase function names.
- Money formatting: keep `fmt`/`fmtM`-style helpers local and consistent
  (`toLocaleString`, `/1_000_000` for millions).
- Import through the `@/` alias, not long relative paths.

## Imports & dependencies

- Reuse existing dependencies (recharts, sonner, lucide, date math via `Date`).
- Don't add a library for something already solved (CSV/PDF are done without libs).
- If you need forms with validation at scale, prefer the already-installed
  `react-hook-form` + `zod` rather than a new dependency.

## Comments

- Explain **why**, not what. Calculation modules carry short doc comments describing
  the actuarial/IFRS 17 method and its simplifications — keep that habit so future
  readers know a formula is intentionally simplified.

## Build & verify before commit

```bash
npx tsc --noEmit     # must be clean
npm run build        # must succeed
```

Commit messages follow the staged style: a title line, then a bulleted summary of
what changed and why.
