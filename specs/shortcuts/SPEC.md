# Spec — Keyboard shortcuts + command palette (navigate any screen)

Adds an app-wide **shortcut system** with a **command palette** modal: press **Ctrl/⌘+K** to open a searchable
list of every registered screen; type to filter, **↑/↓** to move, **Enter** to navigate, **Esc** to close.
Plus a **Settings → Keyboard shortcuts** section to rebind (for now, just the one "Open command palette"
shortcut). Built to extend later to arbitrary commands, not just navigation.

Target repo: `/Users/aneesh/Projects/rnd-the-fe` (Solid 1.9, `@solidjs/router`, Tailwind v4). Read `CLAUDE.md`
and `../conventions.md` first (semantic tokens, logical CSS, provider wiring).

> **Scope & parallelism.** Owns `src/shortcuts/**` and `src/routes/settings/ShortcutsSettings.tsx`. The
> **palette + provider are independent**; two coordination points: (a) the provider must mount **inside the
> Router** (for `useNavigate`) — wiring owned by `../conventions.md`; (b) the Settings editor renders inside
> the Settings screen created by `specs/theming` — so run this **after theming-infra** (or have theming expose
> a settings-sections slot). No dependency on the stocktakes port.

## Dependencies

**None.** Pure Solid signals + DOM `keydown` + `@solidjs/router` `useNavigate`. Reuse the app's existing
overlay/dialog styling; do **not** add a command-palette library. (If the stocktakes `Modal` primitive exists
you may reuse its overlay, but keep the palette self-contained so this spec doesn't depend on that work.)

## Architecture / files

```
src/shortcuts/
  keybinding.ts        # KeyBinding model: parse("ctrl+k") ⇄ match(event) ⇄ format(binding) for display
  config.ts            # DEFAULT_BINDINGS, storage key; the list of rebindable shortcut ids (just "command-palette" for now)
  ShortcutsProvider.tsx# context: bindings (persisted) + global keydown listener + palette open signal; renders <CommandPalette/>
  useShortcuts.ts      # hook: { bindings, setBinding, resetBinding, openPalette, closePalette, isPaletteOpen }
  useCommands.ts       # builds the command list (navigate-to-screen) from the route registry + routeMeta titles
  CommandPalette.tsx   # the modal: search input + filtered list + keyboard nav
  index.ts             # barrel (ShortcutsProvider, useShortcuts, types)
src/routes/settings/ShortcutsSettings.tsx   # "Keyboard shortcuts" settings section (rebind UI)
```

## Keybinding model (`keybinding.ts`)

A binding is `{ ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean; key: string }` (key
lower-cased, e.g. `"k"`). Provide:
- `parse(str)` — `"ctrl+k"` / `"mod+k"` / `"ctrl+shift+p"` → binding. `mod` = Ctrl on Windows/Linux, ⌘ on mac.
- `matches(binding, e: KeyboardEvent)` — true when modifiers + `e.key.toLowerCase()` match. Treat `mod` as
  `e.ctrlKey || e.metaKey`.
- `format(binding)` — display string: `"Ctrl K"` (or `"⌘K"` on mac) for the settings UI.

## Default + storage (`config.ts`)

```ts
export const SHORTCUT_STORAGE_KEY = "rnd-the-fe/shortcuts";
export const SHORTCUTS = [
  { id: "command-palette", label: "Open command palette", default: "mod+k" }, // Ctrl+K / ⌘K
] as const;
```
Bindings persist to `localStorage[SHORTCUT_STORAGE_KEY]` as `{ [id]: "ctrl+k" }`; unset ids fall back to
`default`. Extensible: add rows here later (e.g. "Go to Stocktakes").

## `ShortcutsProvider` + global listener

- Holds a `bindings` store (hydrated from localStorage) and an `isPaletteOpen` signal.
- Registers a single `window` `keydown` listener (in `onMount`, removed in `onCleanup`):
  - If the event matches the `command-palette` binding → `e.preventDefault()` + toggle the palette open.
    (Fire even when focus is in an input — command palettes are intentionally global.)
- Renders `<CommandPalette/>` (so it's available on every route).
- **Must be mounted inside the Router** so the palette's `useNavigate` works — see Coordination.
- `useShortcuts()` exposes bindings + setters + `openPalette/closePalette/isPaletteOpen`.

## Commands (`useCommands.ts`)

Build a navigate-to-screen command per registered screen from the existing route data:
- Source: `src/routes/routes.ts` `ROUTES` + `src/routes/routeMeta.ts` (`ROUTE_TITLES` / `getRouteTitle`).
  Exclude dynamic/detail routes (paths containing `:`, e.g. `/inventory/stocktakes/:id`).
- Shape: `{ id, title, path, keywords?, run: () => navigate(path) }` (via `useNavigate`).
- Design the list as data so non-navigation commands can be added later. (Later this can also merge in the
  i18n `t()`-translated titles once that lands — for now use `getRouteTitle`.)

## `CommandPalette.tsx` (the modal)

- Rendered when `isPaletteOpen()`. A centered panel over a dim overlay (use semantic tokens: `bg-bg`,
  `border-line`, overlay `bg-overlay`; logical CSS per conventions). Kobalte `Dialog` is fine, or a plain
  focus-trapped overlay.
- **Search input** (autofocused on open) filters commands by case-insensitive substring over `title` (+
  `keywords`/`path`). Reset query + highlighted index to 0 on open.
- **List** of filtered commands; the highlighted item styled (`bg-row-hover` or `bg-brand-light`/`text-brand`).
  Mouse hover sets the highlight; click runs.
- **Keyboard** (while open): `ArrowDown`/`ArrowUp` move highlight (wrap around), `Enter` runs the highlighted
  command (`run()` then close), `Esc` closes. `e.preventDefault()` on the arrows so the list doesn't scroll the
  page.
- Show the empty state when no matches. Accessibility: `role="listbox"`/`option` + `aria-selected` on the
  highlighted row (nice-to-have).

## Settings editor (`ShortcutsSettings.tsx`)

A "Keyboard shortcuts" section rendered inside the **Settings screen** (from `specs/theming`). For each entry
in `SHORTCUTS`:
- Show the label + the current binding via `format(...)`.
- A **Rebind** control: a small "record" button/input that captures the next key combo (`keydown` → build a
  binding, ignore lone modifier presses), calls `setBinding(id, binding)` (persists), with a **Reset** to
  default and basic conflict detection (warn if two shortcuts share a combo).
- For now only `command-palette` exists; the UI should already iterate `SHORTCUTS` so adding more is free.

## Coordination / parallelism

- **Provider mounting (owned by `../conventions.md`):** `ShortcutsProvider` must sit **inside the Router**
  (needs `useNavigate`), not in the outer `Providers.tsx` stack. Recommended: mount it via the router root —
  `<Router root={AppRoot}>` where `AppRoot` renders `<ShortcutsProvider>{props.children}</ShortcutsProvider>`
  (in `src/App.tsx`). Add this to the conventions provider-wiring step. This spec **exports** the provider;
  it does not edit `App.tsx`/`index.tsx` itself.
- **Settings section:** `ShortcutsSettings.tsx` is rendered by theming's Settings screen. Run this **after
  theming-infra**; add `<ShortcutsSettings/>` as a Settings section (a 1-line include) or use a settings-
  sections slot theming exposes. The **palette + Ctrl+K work independently** of Settings.
- **Uses existing** `ROUTES` + `routeMeta` (already in `src/routes/`); no dependency on the stocktakes port.
- Follows `../conventions.md` rules (semantic tokens, logical CSS) in all new components.

## Acceptance / verification

- `pnpm typecheck` + `pnpm build` pass; no new dependency.
- `pnpm dev` (with `ShortcutsProvider` mounted inside the Router): **Ctrl/⌘+K** opens the palette from any
  screen; typing filters; ↑/↓ move the highlight (wrapping); Enter navigates to the chosen screen and closes;
  Esc closes; mouse hover/click work. All registered screens appear (detail `:id` route excluded).
- Settings → Keyboard shortcuts lists "Open command palette" with its combo; rebinding persists across reload
  and the new combo opens the palette; Reset restores Ctrl/⌘+K.
