# Design choice — Styling (Tailwind v4)

**Decision:** style with **Tailwind CSS v4** (the Rust/Oxide engine, via `@tailwindcss/vite`), using its
**CSS-first `@theme`** for design tokens. Author with **logical properties** (`ms/me`, `ps/pe`, `start/end`,
`border-s/e`) so RTL mirrors for free.

**Why:**
- **No runtime CSS** — utilities are compiled; only the classes actually used ship (small CSS bundle; ours is
  ~4 KB gzip). Serves the bundle goal.
- **v4 `@theme` emits real CSS variables**, which is exactly what makes the theming system work (see
  `theming.md`) — swap a variable, everything re-colors, no CSS-in-JS.
- **Velocity** — colocated styling an LLM/dev can read and edit without hunting stylesheets; consistent spacing/
  color scale.
- **Built-in `rtl:`/`ltr:` variants + logical utilities** cover RTL (Arabic) with no extra tooling.

## Costs / trade-offs
- **Class-heavy markup** — verbose `class="…"`. Accepted for velocity + zero runtime.
- **Discipline required** — must use **semantic tokens, not raw palette classes, and no `dark:` variants**, or
  theming/RTL break (see `theming.md`, `code-organization.md`, `../specs/conventions.md`). This is the main
  ongoing cost.
- **v4 is newer** — some ecosystem tooling/docs still assume v3 (e.g. important modifier moved to a suffix
  `bg-x!`; `@theme` vs `@theme inline` matters for overridability). Minor gotchas, documented.
- **No component library styling** — we style headless primitives (Kobalte, TanStack) ourselves.

## Alternatives rejected
- **CSS-in-JS / styled-components** — runtime cost, larger bundle, against the goals.
- **Plain CSS/CSS modules** — more boilerplate, weaker token/theming ergonomics than v4 `@theme`.
- **MUI (open-mSupply's choice)** — heavy runtime + opinionated theming; we deliberately don't copy it.

## Net
Tailwind v4 gives zero-runtime, small-bundle styling whose `@theme` variables double as the theming layer and
whose logical utilities double as the RTL layer — one tool serving three goals. Cost is class verbosity + token
discipline.
