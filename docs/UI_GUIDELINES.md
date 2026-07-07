# UI Guidelines

The UI is built on **shadcn/ui** (Radix primitives styled with Tailwind) plus
**recharts** for visuals and **sonner** for toasts. Keep the existing visual language;
do not introduce a second design system.

## Component library

- Primitives live in `src/components/ui/` (49 files: `button`, `card`, `dialog`,
  `table`, `select`, `tabs`, `input`, `badge`, `progress`, `alert-dialog`, …).
- **Do not hand-edit generated `ui/` files.** Compose them; restyle via Tailwind
  utility classes and the CSS tokens.
- Import via the `@/` alias: `import { Button } from "@/components/ui/button"`.

## Theming & design tokens

- Colors are HSL CSS variables defined in `src/index.css` under `:root` (light) and
  `.dark` (dark). Tokens: `--background`, `--foreground`, `--primary`, `--secondary`,
  `--muted`, `--accent`, `--destructive`, `--border`, `--card`, `--popover`, plus
  `--sidebar-*`.
- Tailwind maps these to semantic classes (`bg-background`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `bg-card`, …). **Prefer semantic classes**
  so components work in light and dark automatically.
- Dark mode is class-based (`darkMode: ["class"]` in `tailwind.config.ts`). The `dark`
  class is toggled on `<html>` by `ThemeContext`.

### Known theming caveat
Several older modules use hardcoded palette classes (`text-gray-900`, `bg-blue-50`,
`bg-white`, `text-gray-600`) instead of tokens. These do not adapt to dark mode. New
work should use semantic tokens; migrating existing usages is tracked in
[TECH_DEBT.md](./TECH_DEBT.md).

## Layout conventions

- Page/module root: `<div className="space-y-6">`.
- Module header: flex row with a title block (`text-2xl font-bold`) + description
  (`text-gray-600` / prefer `text-muted-foreground`) on the left, action buttons on the
  right.
- Multi-view modules use `<Tabs>` with a `grid w-full grid-cols-N` `TabsList`.
- Content sits in `<Card>` with `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`.
- KPI rows: `grid grid-cols-2 md:grid-cols-4 gap-4` of small cards.
- Tables use the shadcn `<Table>` family; right-align and `font-mono` numeric cells;
  bold + `border-t-2` for total rows.

## Feedback patterns

- **Toasts:** use `import { toast } from "@/components/ui/sonner"` —
  `toast.success/error/info`. This is the standard across all modules. (A second toast
  system, shadcn `use-toast`/`Toaster`, is mounted but not the convention.)
- **Confirmation:** destructive/irreversible actions use `<AlertDialog>` (e.g. data
  reset, transaction reversal), never the native `confirm()`.
- **Dialogs:** view/edit/detail flows use `<Dialog>`; drive open state with `useState`.
- **Empty states:** show a centered `text-muted-foreground` message when a table or
  chart has no data in scope.

## Charts (recharts)

- Wrap in `<ResponsiveContainer width="100%" height={260}>`.
- Format currency axes with `tickFormatter={(v) => \`${(v/1_000_000).toFixed(1)}M\`}`
  and tooltips with a numeric formatter.
- Consistent series palette: `#2563eb` (blue), `#16a34a` (green), `#dc2626` (red),
  `#9333ea` (purple), `#ea580c` (orange).
- Guard against empty data with an empty-state message rather than rendering an empty
  chart.

## Icons

Use `lucide-react`. Standard sizes: `h-4 w-4` inline in buttons, `h-3 w-3` in compact
table actions, with `mr-1`/`mr-2` spacing.

## Exports (client-side)

- **CSV / text:** build a string, use `downloadFile()` from `src/lib/actuarial.ts`
  (or the local blob-download pattern) — no libraries.
- **PDF:** open a `window.open('', '_blank')`, write a styled HTML document, and call
  `window.print()` (the user saves as PDF). Handle pop-up blockers with a toast.
- **Excel:** exported as a CSV that Excel opens directly (no xlsx library installed).
