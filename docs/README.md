# AfriReVision — Documentation

AfriReVision is a front-end **reinsurance management platform** for an East African
reinsurer. It covers the full inward-reinsurance lifecycle — underwriting, treaty
management, premium booking, claims, retrocession, accounting, actuarial reserving,
and IFRS 17 reporting — as a single-page React application backed by an in-browser
data store.

> **Status:** Working prototype. All data lives client-side (Zustand + `localStorage`).
> There is no backend, no real authentication, and no server persistence. See
> [TECH_DEBT.md](./TECH_DEBT.md) and [NEXT_STAGE.md](./NEXT_STAGE.md).

## Documentation index

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, app shell, state, rendering model, folder layout |
| [DATA_MODEL.md](./DATA_MODEL.md) | Entities in `DataStore`, their fields and relationships |
| [BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md) | End-to-end reinsurance workflow and how data flows between modules |
| [MODULES.md](./MODULES.md) | Every module/component, its responsibilities and key functions |
| [UI_GUIDELINES.md](./UI_GUIDELINES.md) | shadcn/ui usage, theming, layout, toast, chart conventions |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Conventions for calculations, state, TypeScript, file organisation |
| [ROADMAP.md](./ROADMAP.md) | Completed stages and forward direction |
| [CHANGELOG.md](./CHANGELOG.md) | History of the three delivered stages |
| [TECH_DEBT.md](./TECH_DEBT.md) | Known limitations, shortcuts, and prototype caveats |
| [NEXT_STAGE.md](./NEXT_STAGE.md) | Recommended next stage and backend integration points |

## Quick start

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build (tsc-clean, ~640 kB JS bundle)
npm run preview   # preview the production build
npm run lint      # ESLint (see TECH_DEBT.md — config has a known plugin issue)
```

The app opens on a landing page (`/`), a mock login gate, then the Dashboard (`/dashboard`)
which hosts every module via tab navigation.

## Login

Authentication is **mock** — any non-empty username/password is accepted, and the
user picks their own role (Finance / Operations). Do not treat this as security.
See [DATA_MODEL.md](./DATA_MODEL.md#authcontext) and [TECH_DEBT.md](./TECH_DEBT.md).

## High-level architecture

```
React 18 + Vite + TypeScript + Tailwind + shadcn/ui
        │
        ├─ AuthContext        (mock auth, localStorage)
        ├─ ThemeContext       (light/dark, localStorage)
        ├─ DataStore (Zustand) ← single source of truth, persisted to localStorage
        │       ↑ read/write
        ├─ Domain modules (Underwriting, Treaty, Claims, Accounting, Retro, …)
        │
        ├─ src/lib/actuarial.ts   (pure reserving computations — Stage 2)
        └─ src/ifrs17/*           (pure IFRS 17 computations — Stage 3)
```

Calculation logic is deliberately separated from UI: modules render, while
`src/lib/actuarial.ts` and `src/ifrs17/` hold pure, testable functions.
