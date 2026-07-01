# Spec — Theming: light/dark + user-defined themes (switcher under Settings)

> Lives at `specs/theming/`. Largely **independent** of the stocktakes port (`specs/stocktakes/`) and
> **parallel-safe** with the i18n spec (`specs/i18n/`) — see `../conventions.md` and "Coordination".

Target repo: `/Users/aneesh/Projects/rnd-the-fe` (Solid 1.9, Vite, Tailwind v4). Read `CLAUDE.md` — it already
commits to "CSS variables + `data-theme` + Tailwind `@theme` + a persisted ThemeProvider; zero-JS theme swap".
This spec makes that concrete and adds **user-defined custom themes** and a **theme switcher/editor under the
Settings screen**.

> **Scope & parallelism (read `../conventions.md`).** This is **theming-infra**: it owns `src/theme/**`,
> `src/index.css` (tokens), `index.html` (no-FOUC script), and the Settings screen/editor
> (`src/routes/SettingsScreen.tsx` + `src/routes/settings/**`) — a **disjoint** file set from **i18n-infra**,
> so the two run **in parallel**. The app-wide **component palette→token sweep** and the **provider mounting**
> are NOT in this spec — they're the shared unit in `../conventions.md`, run once after both infra tracks (and
> after the stocktakes port). Here you build the token layer, provider, and Settings UI; the sweep later
> converts shared components to the tokens this spec defines.

## Approach & why it's cheap

A theme = **a set of values for a fixed list of semantic CSS variables**. Components/utilities reference only
those variables, so switching a theme changes variable values — nothing regenerates.
- **No theming library** (no daisyUI/theme-change/CSS-in-JS). Runtime = a signal + a `setProperty` loop +
  `matchMedia` (~1–2 KB), regardless of how many custom themes exist.
- **Built-in themes** (light/dark) are static CSS blocks keyed by `[data-theme="…"]` — compiled once by
  Tailwind, a few hundred bytes each, zero runtime.
- **Custom themes** are a JSON map of `--color-*` → value applied via `element.style.setProperty(...)` on
  `<html>` (inline style beats the `[data-theme]` blocks, so a custom theme just wins). No CSS is produced at
  runtime.

Tailwind v4 note: keep color tokens in a **plain `@theme` block (NOT `@theme inline`)** so they stay
overridable CSS variables — utilities emit `background-color: var(--color-bg)`, so overriding the variable in
a `[data-theme]` block or via inline `setProperty` cascades to every utility automatically.

## Dependencies

**None.** Native CSS custom properties + DOM `style.setProperty` + `matchMedia`. No new packages.

## Architecture / files

```
src/theme/
  tokens.ts          # TOKENS: the canonical themeable variable list (the contract) + groups/labels for the editor
  config.ts          # BUILTIN_THEMES ("light" | "dark" | "system"), storage keys, DEFAULT_THEME
  ThemeProvider.tsx  # context: themeId signal (persisted) + custom-theme store; applies data-theme / vars; matchMedia
  useTheme.ts        # hook: { themeId, setTheme, themes (builtin+custom), customThemes, saveCustomTheme, deleteCustomTheme }
  index.ts           # barrel
src/routes/SettingsScreen.tsx        # replace the placeholder with a real Settings page (Appearance section)
src/routes/settings/ThemeSwitcher.tsx  # the switcher (choose theme)
src/routes/settings/ThemeEditor.tsx    # create/edit a custom theme (color inputs + live preview)
index.html          # + a tiny inline no-FOUC script (not bundled)
src/index.css       # semantic @theme tokens (light) + [data-theme="dark"] overrides
```

## 1. Semantic token contract (`tokens.ts` + `index.css`)

Reorganise `index.css` from brand-only names to a **semantic** set every theme fills in. Components use these
(`bg-surface text-fg border-line`), never raw palette classes and never `dark:` variants (the `dark:` variant
can't express arbitrary user themes).

```css
/* index.css — default = light. Plain @theme (overridable vars). */
@theme {
  --color-bg: #ffffff;      --color-surface: #f4f5f7;   --color-overlay: #00000030;
  --color-fg: #1f2126;      --color-muted: #8f9299;
  --color-line: #e4e6eb;    --color-row-hover: #f7f8fa;
  --color-brand: #e85c2e;   --color-brand-hover: #d24e23; --color-brand-light: #fdeee8;
  --color-on-brand: #ffffff;
  --color-danger: #d64545;  --color-success: #2e9e5b;
  /* keep breakpoints etc. as-is */
}
[data-theme="dark"] {
  --color-bg: #16181d;  --color-surface: #1f2229;  --color-fg: #e7e9ee;  --color-muted: #8b8f99;
  --color-line: #2c2f37; --color-row-hover: #232630; --color-brand-light: #3a2016;
}
/* "system" follows the OS when selected */
@media (prefers-color-scheme: dark) { [data-theme="system"] { /* same dark values */ } }
```

`tokens.ts` exports the machine-readable list the **editor** iterates over:
```ts
export const TOKENS = [
  { var: "--color-bg", label: "Background", group: "Surfaces" },
  { var: "--color-surface", label: "Surface", group: "Surfaces" },
  { var: "--color-fg", label: "Text", group: "Text" },
  { var: "--color-muted", label: "Muted text", group: "Text" },
  { var: "--color-line", label: "Border", group: "Surfaces" },
  { var: "--color-brand", label: "Brand", group: "Brand" },
  { var: "--color-brand-hover", label: "Brand (hover)", group: "Brand" },
  { var: "--color-on-brand", label: "On-brand text", group: "Brand" },
  { var: "--color-danger", label: "Danger", group: "Status" },
  // …one entry per themeable var
] as const;
export type ThemeVars = Partial<Record<(typeof TOKENS)[number]["var"], string>>;
```

## 2. `ThemeProvider` + `useTheme` (the only runtime)

`config.ts`: `BUILTIN_THEMES = ["light","dark","system"] as const`, `DEFAULT_THEME = "system"`,
`THEME_STORAGE_KEY = "rnd-the-fe/theme"`, `CUSTOM_THEMES_STORAGE_KEY = "rnd-the-fe/custom-themes"`.

`ThemeProvider.tsx` — export it; **mounting is owned by `../conventions.md`** (`src/app/Providers.tsx`); do
not edit `src/index.tsx` here (temporarily wrap for local testing and revert). Responsibilities:
- `themeId` signal init from `localStorage[THEME_STORAGE_KEY]` → else `DEFAULT_THEME`. `setTheme` persists.
- `customThemes` store: `Array<{ id: string; name: string; vars: ThemeVars }>` persisted to
  `CUSTOM_THEMES_STORAGE_KEY`. CRUD: `saveCustomTheme(theme)`, `deleteCustomTheme(id)`.
- `createEffect` applies the current theme:
  ```ts
  const root = document.documentElement;
  // clear any previously-applied inline custom vars
  TOKENS.forEach(t => root.style.removeProperty(t.var));
  const custom = customThemes.find(c => c.id === themeId());
  if (custom) { root.dataset.theme = "custom"; for (const [k,v] of Object.entries(custom.vars)) root.style.setProperty(k, v); }
  else root.dataset.theme = themeId();   // "light" | "dark" | "system"
  ```
- `matchMedia("(prefers-color-scheme: dark)")` listener: only needs to trigger a re-render when
  `themeId() === "system"` (CSS handles the actual values via the media query block).
- `useTheme()` exposes `{ themeId, setTheme, themes: [...BUILTIN_THEMES, ...customThemes], customThemes, saveCustomTheme, deleteCustomTheme }`.

## 3. No-FOUC inline script (`index.html`, not bundled)

Add a tiny inline `<script>` in `<head>` that runs before first paint, so the correct theme is applied
immediately (no flash of light theme):
```html
<script>
  (function () {
    try {
      var id = localStorage.getItem("rnd-the-fe/theme") || "system";
      var custom = JSON.parse(localStorage.getItem("rnd-the-fe/custom-themes") || "[]");
      var c = custom.find(function (t) { return t.id === id; });
      var root = document.documentElement;
      if (c) { root.dataset.theme = "custom"; for (var k in c.vars) root.style.setProperty(k, c.vars[k]); }
      else root.dataset.theme = id;
    } catch (e) {}
  })();
</script>
```
(Keep the storage keys in sync with `config.ts`.)

## 4. Settings screen — the switcher

Replace the `Placeholder` in `src/routes/SettingsScreen.tsx` with a real Settings page containing an
**Appearance** section:
- `src/routes/settings/ThemeSwitcher.tsx` — lists **Light / Dark / System** + each custom theme as selectable
  cards/radios (small swatch preview using the theme's `bg`/`surface`/`brand`). Selecting calls `setTheme(id)`
  → applies live. Show which is active.
- A **"Create theme"** button opens `ThemeEditor`; each custom theme row has Edit/Delete.
- Use the shared `Menu`/`Modal` primitives from the stocktakes `00-foundation` if already present; otherwise a
  simple inline panel is fine (theming must not hard-depend on the stocktakes work — see Coordination).

## 5. Theme editor (define your own theme)

`src/routes/settings/ThemeEditor.tsx` (a modal or panel):
- A name field + one **color input** (`<input type="color">` — native, zero-dep) per `TOKENS` entry, grouped
  by `token.group`, seeded from the current computed values (`getComputedStyle(root).getPropertyValue(var)`),
  or from the theme being edited.
- **Live preview**: as the user changes a color, `root.style.setProperty(token.var, value)` immediately so the
  whole app reflects it (the Settings page itself is the preview). On **Cancel**, restore the previously active
  theme (re-run the provider apply). On **Save**, `saveCustomTheme({ id, name, vars })`, set it active, persist.
- Optional niceties (no libs): a WCAG contrast hint between `fg`/`bg` (compute ratio in JS), "Duplicate from
  Light/Dark" to prefill, and export/import a theme as JSON (copy/paste) so users can share themes.

## 6. Component token conversion — the shared sweep (NOT this spec)

The `SettingsScreen`/`settings/**` this spec creates must use the semantic tokens from the start. But
converting the **existing shared components** (`components/layout/*`, `components/table/*`, `layouts/*`, the
stocktakes screens) from palette classes → semantic tokens is the **shared component sweep** in
`../conventions.md` — done **once**, together with the i18n physical→logical CSS + `t()` changes, so each file
is touched a single time. **Do not audit/convert shared components in this spec.** (This spec only guarantees
the token layer exists and the Settings UI consumes it.)

## Coordination / parallelism

- **Parallel-safe with i18n-infra**: disjoint files (see `../conventions.md` matrix — theming owns
  `src/theme/**` + `index.css` + `index.html` + Settings; i18n owns `src/intl/**` + `LanguageSelect` +
  `StoreBar` switcher). Run them concurrently.
- **Provider mount + component sweep** are the shared unit in `../conventions.md`, run **after** both infra
  tracks and **after** the stocktakes port. Don't touch `index.tsx` or shared components here.

## Acceptance / verification (theming-infra)

- `pnpm typecheck` + `pnpm build` pass; **no new dependency** added; bundle delta is only the small provider.
- With `ThemeProvider` mounted (temporarily, for testing): Settings → Appearance switches Light/Dark/System
  live; System follows the OS setting; choice persists across reload with **no flash** (inline script). Even
  before the sweep, any component already using tokens re-themes; the Settings UI itself must re-theme.
- Creating a custom theme via the editor updates token values live (visible on token-using elements), saves,
  appears in the switcher, persists across reload, editable/deletable; export/import round-trips (if built).
- (Full-app theming across every component — and light/dark/custom × RTL composing — is validated after the
  `../conventions.md` sweep, which also owns the "no hardcoded colors / no `dark:`" grep check.)
