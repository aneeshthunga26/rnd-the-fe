# Design choice — Theming

**Decision:** theme with **semantic CSS-variable tokens** (Tailwind v4 `@theme`), swap built-in themes via a
`data-theme` attribute on `<html>`, and apply **user-defined custom themes** by writing token values with
`element.style.setProperty`. No theming library, no CSS-in-JS. (Full implementation spec: `specs/theming/SPEC.md`;
component rules: `specs/conventions.md`.)

**Why:** a theme is just *a set of values for a fixed list of semantic tokens*, so switching = changing
variable values — the browser does the work via the cascade. This keeps cost out of the bundle/runtime and
supports unlimited user themes for free. The price is paid in **discipline**, not bytes.

## What it costs

### Near-zero — bundle & libraries
- No theming lib, no CSS-in-JS. Only the `ThemeProvider` (a signal + a `setProperty` loop + a `matchMedia`
  listener) ≈ 1–2 KB.
- Built-in themes are static CSS (`[data-theme="dark"] { … }`) — a few hundred bytes each, compiled once.
- Custom themes add **zero CSS** — they're runtime variable values. N custom themes cost nothing in the bundle.

### Cheap but real — runtime
- Switching a theme triggers a **full-document style recalc + repaint** (changing `--color-*` on `:root`
  restyles every element that reads those vars). One-time, user-initiated — fine, but it's a *global* restyle.
- Applying a custom theme = a `setProperty` loop over ~10–20 tokens; the FOUC inline script does the same
  before first paint. Negligible.
- Utilities resolve `var(--color-x)` at use-time (Tailwind v4 default): a trivially small overhead vs inlined
  values; not measurable in practice.

### The real price — discipline & contract
- **Semantic-token discipline (biggest ongoing cost).** Every component must use tokens (`bg-surface`,
  `text-fg`, …) with **no hardcoded colors and no `dark:` variants** (the `dark:` variant can't express custom
  themes). Anything that hardcodes a color won't theme. This is the audit/sweep now + a permanent authoring
  rule, and a mental-model shift (think in roles, not palette).
- **Token-contract rigidity + versioning.** The semantic token set is designed up front; renaming/removing a
  token means touching all built-in themes **and** every stored user theme. Saved custom themes are var-maps
  that can go **stale**: add a token later and old themes don't define it (falls back to the `:root`/light
  value → mixed look); remove one and their value is dead. → keep a small **version/migration** for stored
  custom themes.
- **Partial custom themes.** `data-theme="custom"` has no CSS block, so any token the user doesn't set falls
  back to the `:root` (light) default — a half-defined custom theme mixes custom + light. The editor must
  **seed all tokens** (or you accept that fallback).

### Correctness / a11y edge cases (custom themes)
- Users can choose **unreadable/low-contrast** combos → either add a WCAG contrast check (optional in the spec)
  or ship the risk.
- Values flow into `style.setProperty` — low risk (color inputs), but validate/sanitize them.

### Maintenance & scope
- **FOUC inline script duplicates knowledge** (storage keys + apply logic live in both `index.html` and
  `ThemeProvider`) — must be kept in sync.
- **Persistence is per-device localStorage** — custom themes don't sync across devices/users unless a backend
  field is added later.

## What you don't pay
- No SSR theming complexity (SPA). No runtime stylesheet generation. No per-component `dark:` duplication. No
  extra cost as the number of custom themes grows.

## Net
Trades **bytes/runtime for discipline**: cheap to ship and switch, but only works if the whole app speaks
semantic tokens, and custom themes carry a small maintenance tail (token versioning, seed-all-tokens,
contrast). Given the goals (small bundle, arbitrary user themes), that trade is the right one.

## How the variables are applied at runtime

It's pure CSS cascade + inheritance — no component re-rendering.

### Setup (compiled once by Tailwind v4)
`@theme { --color-bg: #fff; --color-fg: #1f2126; … }` compiles to:
1. Tokens as custom properties on `:root`: `:root { --color-bg:#ffffff; --color-fg:#1f2126; … }`
2. Utilities that **reference** them (not inline): `.bg-bg{ background-color: var(--color-bg) } .text-fg{ color: var(--color-fg) }`
   — only overridable because we use plain `@theme` (NOT `@theme inline`, which would bake the literal value in).

Plus the authored override block in `index.css`: `[data-theme="dark"] { --color-bg:#16181d; … }`.
Component markup is static (`class="bg-bg text-fg"`) and **never changes** across themes.

### What resolves the color
Custom properties **inherit**. The tokens are declared on `<html>`, so every descendant resolves
`var(--color-bg)` by inheriting from `<html>`. Thus the whole app's colors are decided by **which `--color-*`
declarations win on `<html>`**. Switching a theme = changing those. Two mechanisms:

1. **Built-in themes → `data-theme` attribute.** The provider sets `document.documentElement.dataset.theme =
   "dark"`; `<html>` now matches `[data-theme="dark"]`, which redefines the tokens on the html element; they
   inherit down; every `var()` lookup returns the dark value. One style-recalc + repaint.
2. **Custom themes → inline `setProperty`.** The provider sets `data-theme="custom"` (no stylesheet block) and
   writes values inline on `<html>`: `document.documentElement.style.setProperty("--color-bg", "#faf7f0")`.
   Inline styles beat any stylesheet selector, so these win, inherit down, and utilities pick them up. When
   leaving a custom theme, the provider `removeProperty(...)` all tokens first so they don't linger.

### Precedence on `<html>` (low → high)
```
:root (@theme / light defaults)
  → [data-theme="dark"] block        (when the attribute matches)
    → inline style on <html>          (custom theme; always wins)
```
Whatever wins on `<html>` inherits to the entire tree, so one write re-colors everything.

### Trace — `<span class="text-fg">`
- default → `color: var(--color-fg)` inherits `#1f2126` from `:root`.
- `html[data-theme="dark"]` sets `--color-fg:#e7e9ee` on html → same `var()` now resolves to light grey.
- custom theme → `html.style` has `--color-fg` inline → resolves to that. The span never re-rendered; only the
  inherited variable changed.

### Why no component re-render
The Solid signal only flips an attribute / a few inline props on `<html>`; it doesn't touch the reactive graph
or DOM structure. The recolor is entirely the browser re-resolving `var()` through the cascade — which is why
it's "zero-JS" at the component level and cheap.
