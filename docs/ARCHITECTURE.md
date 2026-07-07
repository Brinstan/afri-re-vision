# Architecture

## Tech stack

| Layer | Choice | Version |
|---|---|---|
| Build tool | Vite | ^5.4.1 (`@vitejs/plugin-react-swc`) |
| Language | TypeScript | ^5.5.3 |
| UI library | React | ^18.3.1 |
| Routing | react-router-dom | ^6.26.2 |
| State | Zustand | ^4.4.7 (with `persist` middleware) |
| Styling | Tailwind CSS | ^3.4.11 |
| Components | shadcn/ui (Radix primitives) | see `package.json` |
| Charts | recharts | ^2.12.7 |
| Icons | lucide-react | ^0.462.0 |
| Toasts | sonner | ^1.5.0 |
| Forms (available) | react-hook-form + zod | ^7.53 / ^3.23 |
| Server-state (available, unused) | @tanstack/react-query | ^5.56.2 |

> `react-hook-form`, `zod`, and `@tanstack/react-query` are installed and wired at the
> root (`QueryClientProvider`) but **not yet used** by feature code — forms are
> controlled by hand today. See [TECH_DEBT.md](./TECH_DEBT.md).

## Application shell

`src/main.tsx` mounts `<App />`. `src/App.tsx` composes the provider stack:

```
<ThemeProvider>                     (src/components/ThemeContext.tsx)
  <QueryClientProvider>             (@tanstack/react-query — configured, mostly idle)
    <TooltipProvider>
      <Toaster /> <Sonner />        (two toast systems present; sonner is used by modules)
      <AuthProvider>                (src/components/AuthContext.tsx)
        <AppContent />              (auth gate → BrowserRouter → routes)
```

`AppContent` renders `<LoginForm />` when unauthenticated, otherwise a `BrowserRouter`
with routes:

| Path | Component |
|---|---|
| `/` | `pages/Index.tsx` (landing) |
| `/dashboard` | `pages/Dashboard.tsx` (application shell) |
| `*` | `pages/NotFound.tsx` |

## The Dashboard shell

`pages/Dashboard.tsx` is the real workspace. It holds a header (KPIs, dark-mode
toggle, Settings dialog, logout), a horizontal tab nav, and a `switch` on
`activeModule` that renders one domain module at a time:

```
dashboard | underwriting | actuarial | pricing | accounting | claims | treaties | retrocession | ifrs
```

Module switching is **local `useState`**, not routes — the whole app is effectively
two routes (landing, dashboard). KPI cards and portfolio counts on the default
dashboard view are computed live from `DataStore`.

## State management

Three independent stores, all client-side:

1. **`DataStore` (Zustand)** — the domain source of truth: treaties, claims,
   underwriting contracts, premium bookings. Persisted to `localStorage` under
   `afrirevision-data` via the `persist` middleware. See [DATA_MODEL.md](./DATA_MODEL.md).
2. **`AuthContext` (React Context)** — mock user session, persisted under `user`.
3. **`ThemeContext` (React Context)** — light/dark, persisted under `theme`, toggles
   the `dark` class on `<html>`.

Additional persisted keys owned by calculation layers:
- `afrirevision-actuarial-assumptions` — Stage 2 workbench assumptions.
- `afrirevision-ifrs17-assumptions` — Stage 3 IFRS 17 assumptions.

## Calculation vs. UI separation

A core architectural rule (introduced in Stage 2): **computations are pure functions
in dedicated modules; components only render.**

```
src/lib/actuarial.ts     Triangles, development factors, Chain Ladder / BF /
                         Cape Cod / ELR, Mack SE, XOL analytics, portfolio analytics.
src/ifrs17/              LRC, LIC, fulfilment cash flows, risk adjustment,
                         financial statements, reporting/exports, assumptions, types.
```

The IFRS 17 layer **reuses** actuarial outputs (IBNR, ELR, selected reserving
method) rather than duplicating them — `IfrsReporting.tsx` reads the actuarial
assumptions from `localStorage` and calls `buildMethodInputs`/`runAllMethods`.

## Folder layout

```
src/
├── main.tsx                     Entry point
├── App.tsx                      Provider stack + routes
├── index.css                    Tailwind layers + CSS design tokens (light/dark)
├── App.css                      Legacy CRA-style styles (largely unused)
├── components/
│   ├── AuthContext.tsx          Mock auth
│   ├── ThemeContext.tsx         Dark mode
│   ├── DataStore.tsx            Zustand domain store (source of truth)
│   ├── LoginForm.tsx            Login gate
│   ├── UnderwritingModuleIntegrated.tsx
│   ├── TreatyManagementIntegrated.tsx
│   ├── ClaimsModuleLinked.tsx
│   ├── AccountingModule.tsx
│   ├── RetrocessionModule.tsx
│   ├── PricingSystem.tsx
│   ├── ActuarialEngine.tsx      Consumes src/lib/actuarial.ts
│   ├── IfrsReporting.tsx        Consumes src/ifrs17/*
│   ├── PortfolioAnalysis.tsx    Rendered inside AccountingModule
│   └── ui/                      shadcn/ui primitives (49 files) — do not hand-edit
├── pages/
│   ├── Index.tsx                Landing
│   ├── Dashboard.tsx            App shell
│   └── NotFound.tsx
├── lib/
│   ├── actuarial.ts             Stage 2 reserving library (pure)
│   └── utils.ts                 cn() classname helper
├── ifrs17/                      Stage 3 IFRS 17 calculation modules (pure)
│   ├── types.ts
│   ├── assumptions.ts
│   ├── riskAdjustment.ts
│   ├── lrc.ts
│   ├── lic.ts
│   ├── fulfilmentCashFlows.ts
│   ├── financialStatements.ts
│   └── reporting.ts
└── hooks/
    ├── use-mobile.tsx
    └── use-toast.ts             (shadcn toast hook; modules mostly use sonner)
```

`@/` is aliased to `src/` (see `tsconfig`/`vite.config.ts`).

## Rendering & reactivity model

- Modules subscribe to `useDataStore()`; any store mutation re-renders consumers.
- Heavy computation (triangles, reserving, IFRS 17 roll-forwards) is wrapped in
  `useMemo` keyed on the relevant store slices and assumptions, so it recomputes only
  when inputs change.
- There is no async data layer — everything is synchronous, in-memory, and derived on
  render. This is fast at prototype data volumes but is the main scaling constraint
  (see [TECH_DEBT.md](./TECH_DEBT.md)).
