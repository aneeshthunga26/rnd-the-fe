# Kickoff — implement i18n + theming + shortcuts in parallel worktrees, then integrate on base

Paste the block below into Claude Code at the repo root (`/Users/aneesh/Projects/rnd-the-fe`). It runs the
three **infra** specs concurrently in git worktrees (they're designed to touch disjoint files), merges them
back, then does the shared **integration + component sweep** from `specs/conventions.md` on the base branch.

---

```
Orchestrate parallel implementation of three specs in git worktrees, then merge and integrate on the base
branch. Repo root: /Users/aneesh/Projects/rnd-the-fe.

FIRST, read: specs/conventions.md, specs/i18n/SPEC.md, specs/theming/SPEC.md, specs/shortcuts/SPEC.md, and
CLAUDE.md. The three infra specs are designed to own DISJOINT files (see the conventions file-ownership
matrix) so they can be built concurrently; the provider wiring and the app-wide component sweep are the shared
conventions unit, done last on the base branch.

Preconditions: `git status` clean. Let BASE = the current branch. Everything below branches off BASE.

PHASE 1 — parallel worktrees (run the three agents concurrently, each in its own worktree/branch):
  Create: `git worktree add ../rnd-i18n     -b feat/i18n     BASE`
          `git worktree add ../rnd-theming  -b feat/theming  BASE`
          `git worktree add ../rnd-shortcuts -b feat/shortcuts BASE`
  Launch one implementation agent per worktree, IN PARALLEL, each scoped to ONLY its spec's owned files:
   • feat/i18n  → specs/i18n/SPEC.md    : src/intl/**, src/components/inputs/LanguageSelect.tsx, and the
                                          StoreBar.tsx switcher edit. Add @solid-primitives/i18n@^2.2.1.
   • feat/theming → specs/theming/SPEC.md: src/theme/**, src/index.css (semantic tokens + [data-theme]),
                                          index.html (no-FOUC script), src/routes/SettingsScreen.tsx +
                                          src/routes/settings/**.
   • feat/shortcuts → specs/shortcuts/SPEC.md: src/shortcuts/**, src/routes/settings/ShortcutsSettings.tsx
                                          (as a standalone component).
  RULES for every agent: obey CLAUDE.md + conventions (semantic tokens, logical CSS, components as
  `export const X: Component`) for all NEW files; export their Provider but DO NOT edit src/index.tsx,
  src/App.tsx, or any shared component outside their owned set (provider mounting, the Settings-section
  include, and the component sweep are Phase 3). Each agent must make `pnpm typecheck` and `pnpm build` pass
  IN ITS WORKTREE, then commit to its branch. Report per-branch status.

PHASE 2 — merge back onto BASE (resolve conflicts):
  On BASE, merge in this order: feat/theming, then feat/i18n, then feat/shortcuts (`git merge --no-ff`).
  Conflicts should be minimal because the specs are disjoint — expect at most: package.json (union the deps —
  keep @solid-primitives/i18n + kobalte if present), pnpm-lock.yaml (re-run `pnpm install` to regenerate),
  and possibly `src/routes/registry.tsx`/`routeMeta.ts` if two touched them (keep both additions). Resolve by
  keeping BOTH sides' additions; never drop a spec's files. After each merge run `pnpm typecheck`.

PHASE 3 — integration + component sweep on BASE (specs/conventions.md):
  1. Create src/app/Providers.tsx composing QueryClientProvider > ThemeProvider > I18nProvider > App; point
     src/index.tsx at it. Mount ShortcutsProvider INSIDE the Router via `<Router root={AppRoot}>` in
     src/App.tsx (AppRoot renders <ShortcutsProvider>{props.children}</ShortcutsProvider>) so useNavigate works.
  2. Render <ShortcutsSettings/> as a section in the Settings screen.
  3. Run the one-pass component sweep across the shared files (src/components/layout/*, src/components/table/*,
     src/layouts/*, src/routes/** screens, src/components/icons.tsx, src/routes/routeMeta.ts + AppBar/
     MobileHeader title translation): convert palette classes → semantic tokens, physical → logical CSS,
     mirror directional icons (rtl:-scale-x-100), and wrap user-facing strings in t() (add keys to
     src/intl/dictionaries/en.ts + translations). Swap columns.tsx's ad-hoc formatDate for intl format.ts.
     Follow the conventions grep-clean acceptance (no `dark:`, no hardcoded colors, no physical directions).

VERIFY on BASE: `pnpm typecheck` + `pnpm build` pass. `pnpm dev` (server per .env or VITE_USE_MOCK if still
present): Ctrl/⌘+K opens the command palette and navigates to any screen; the StoreBar language switcher flips
all strings and sets <html dir/lang> (Arabic → RTL mirrors the whole layout); Settings switches Light/Dark/
System and creates/persists a custom theme; light/dark/custom × RTL all compose. Clean up the worktrees
(`git worktree remove`). Do NOT push or open a PR unless asked — report a summary of what merged and any
conflicts resolved.

Notes: if the stocktakes port (specs/stocktakes/*) is still in-flight on other branches, this run only sweeps
the components that exist on BASE now; re-run the Phase-3 sweep over the stocktakes files when they land.
```

---

**Why this is safe to parallelize:** the three infra specs own disjoint files (i18n → `src/intl` + `LanguageSelect`
+ `StoreBar`; theming → `src/theme` + `index.css` + `index.html` + Settings; shortcuts → `src/shortcuts` +
`ShortcutsSettings`). Nothing edits `index.tsx`/`App.tsx`/shared components in Phase 1 — those are Phase 3 — so
merges rarely conflict beyond `package.json`/lockfile. See `specs/conventions.md` for the ownership matrix and
the sweep detail.
