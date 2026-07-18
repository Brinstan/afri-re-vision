# Phase 5 — UI/UX Design

The design system is **implemented**, not aspirational — this documents it and
sets the rules for everything still to be built.

## 1. Design System

- Base: **shadcn/ui** primitives (49 components in `src/components/ui/`) on Radix — accessible by construction.
- Tokens: semantic CSS variables (`--background`, `--card`, `--foreground`, `--muted`, `--border`, `--primary`, `--destructive`) in `src/index.css`; **never** hardcoded palette classes (enforced since the dark-mode overhaul).
- Status colors always pair light + dark variants: e.g. `bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300`.
- Density: enterprise-compact; cards for grouping, tables for registers, tabs for workstation sections.

## 2. Color Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| background | white | slate-950 | Page |
| card | white | slate-950 tone | Panels |
| primary | blue-600 family | light | Actions, active nav |
| muted-foreground | gray-500 | gray-400 | Secondary text |
| destructive | red-600 | red-400 | Dangerous actions |
| Semantic status | green=positive/settled, yellow=warning/pending, red=negative/overdue, blue=informational | | Badges, alerts, deltas |

## 3. Typography

System font stack (Tailwind default). Scale: `text-2xl` page titles,
`text-lg` card titles, `text-sm` body/tables, `text-xs` metadata. Numbers
right-aligned in tables; monetary values formatted `USD 44.3M` (compact) or
locale full form in registers.

## 4. Layout Structure

Header (brand, user identity+role, theme, settings, logout) → module nav bar
(horizontal tabs, filtered by granted modules) → main content (module
workstation). Workstations: title + description row, action buttons right,
then Tabs for sections, cards/tables inside. Dialogs for create/edit;
AlertDialog for destructive confirmation.

## 5. Navigation Structure

Ten modules (Dashboard, Underwriting, Actuarial, Pricing, Accounting, Claims,
Treaties, Retrocession, IFRS 17, Administration). **Navigation renders only
modules granted to the signed-in user**; deep access is guarded again in
content rendering and (production) at the API. Within modules: shadcn Tabs.

## 6. User Flows (implemented + target)

1. Login → (granted modules only) → Dashboard.
2. Admin: New User → role template → tailor module checkboxes → create → user appears in access matrix.
3. Underwriting: capture → validate → preview → convert to treaty → toast + treaty visible in Treaties.
4. Claims: register → treaty auto-link → allocate layers → reserve → (prod: submit for approval → approve) → pay → recovery visible in Retrocession.
5. Quarterly: Actuarial select method → IFRS 17 reflects IBNR → Accounting statements → (prod: close period).

## 7. Wireframes

The live application is the wireframe of record (each module screen is
implemented). New screens follow the workstation pattern above. For the
production additions:

- **Approvals inbox:** table of pending items (type, maker, amount, age) + approve/reject with comment.
- **Period close:** period list with status chips; close wizard (pre-close checklist → confirm → progress → frozen summary).
- **Audit viewer:** filterable table (actor, module, entity, date range) + before/after diff drawer.

## 8–10. Responsive Screens

- **Desktop (≥1280):** full workstations as implemented.
- **Tablet (768–1279):** nav collapses to scrollable tab strip (already), KPI grids 2-up, tables scroll horizontally within cards.
- **Mobile (<768):** read-oriented — Dashboard KPIs stacked 1-up, registers as cards; capture-heavy flows (underwriting, admin) flagged desktop-first. Nav becomes a sheet menu (to build).

## 11. Accessibility Requirements (WCAG 2.1 AA)

- Radix primitives give focus management, ARIA roles, Esc/arrow behavior.
- Color contrast ≥ 4.5:1 in both themes (semantic tokens chosen for this).
- All inputs labelled (`Label htmlFor`); errors as text, not color alone.
- Status badges carry text, never color-only meaning.
- Keyboard: every action reachable; dialogs trap focus; tables navigable.
- `prefers-reduced-motion` respected (no essential animation).

## Screen Inventory (purpose · components · actions · validation)

| Screen | Purpose | Key components | User actions | Validation |
|---|---|---|---|---|
| Login | Authenticate | Card, Inputs, Button | Sign in | Required fields; invalid/inactive account message |
| Dashboard | Overview | KPI cards, quick actions, alerts | Navigate (granted only) | — |
| Underwriting | Capture contracts | Form (35+ fields), preview Dialog, table | Create, preview, convert | Dates, premium>0, duplicate contract no. |
| Treaties | Administer | Table, booking Dialog, returns | Book premium, mark paid, export | Amount>0, period format |
| Claims | Lifecycle | Form, layer table, docs | Register, allocate, pay | Loss date within treaty period; amounts ≤ limits |
| Actuarial | Reserving | Assumption panel, triangle grid, method cards, charts | Set assumptions, select method, export | Numeric ranges; method requires data |
| Pricing | Price treaties | Setup form, method cards, build-up, scenarios, AI tabs | Price, import CSV, save quote | Structure-specific (attachment<exhaustion…); CSV schema |
| Accounting | Finance | 11 tabs: GL, AR, AP, cash, TB, statements… | Manual journal, reconcile, pay | Journal balances; payment ≤ outstanding |
| Retrocession | Outward | Programme dialog (type-specific), placements, recoveries | Create programme, place lines, settle | Signed lines=100%; type-specific terms |
| IFRS 17 | Reporting | Filter bar, LRC/LIC tables, statements | Filter, export | Valuation date |
| Administration | Access control | User table, access matrix, create/edit/password Dialogs | Create user, grant modules, deactivate, reset pw | Unique username; pw≥6 (prod: ≥10); ≥1 admin; no self-lockout |
