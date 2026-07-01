# Shared conventions — semantic tokens + logical CSS + i18n (and how i18n/theming run in parallel)

This doc is shared by `specs/i18n/SPEC.md` and `specs/theming/SPEC.md`. It exists so those two specs
can be **executed in parallel**: it owns the pieces they'd otherwise both touch (the app-wide **component
sweep** and the **provider wiring**), leaving each spec a **disjoint** set of files.

## Execution order (what runs when)

```
[ stocktakes waves 00→10 ]                        ← existing specs/stocktakes/*
        │
        ▼
  ┌──────────────────────┐     ┌──────────────────────┐
  │ i18n-infra           │  ∥  │ theming-infra        │   ← THESE TWO RUN IN PARALLEL (disjoint files)
  │ (specs/i18n)         │     │ (specs/theming)      │
  └───────────┬──────────┘     └──────────┬───────────┘
              └───────────────┬───────────┘
                              ▼
                   ┌──────────────────────┐
                   │ conventions sweep     │   ← run ONCE, after BOTH infra (and ideally after stocktakes)
                   │ (this doc)            │
                   └──────────────────────┘
```

- **i18n-infra** and **theming-infra** touch **no common file** (matrix below) → safe to run concurrently.
- Neither infra edits `src/index.tsx` or the shared UI components. Both are additive new folders + a couple of
  owned edits. Provider mounting + the component sweep are this doc's job, run afterwards.

## File-ownership matrix (proves parallel-safety)

| Unit | Creates / edits (owns) |
|---|---|
| **i18n-infra** | `src/intl/**`; `src/components/inputs/LanguageSelect.tsx`; edits `src/components/layout/StoreBar.tsx` (the "English" stub → language switcher). Exports `I18nProvider`. Does **not** edit `index.tsx`, `index.css`, `index.html`, `routeMeta.ts`, or shared components. |
| **theming-infra** | `src/theme/**`; edits `src/index.css` (semantic tokens + `[data-theme]`); edits `index.html` (no-FOUC script); replaces `src/routes/SettingsScreen.tsx` + adds `src/routes/settings/**` (switcher + editor). Exports `ThemeProvider`. Does **not** edit `index.tsx`, `StoreBar.tsx`, or shared components. |
| **conventions (this doc)** | `src/app/Providers.tsx` + edits `src/index.tsx` (mount providers); the **component sweep** across `src/components/layout/*`, `src/components/table/*`, `src/layouts/*`, `src/routes/**` screens, `src/components/icons.tsx`, `src/routes/routeMeta.ts`, and the AppBar/MobileHeader title rendering. |

Intersection of i18n-infra and theming-infra owned files = **∅**. StoreBar is i18n-only (theme switcher lives
under Settings, not the footer); `index.css`/`index.html`/Settings are theming-only.

> For local verification an infra agent may **temporarily** wrap the app in its provider to test, but must not
> commit an `index.tsx` edit — the canonical wiring is `Providers.tsx` below. (Or just run the tiny provider
> step from this doc after infra.)

## Provider wiring (owned here)

`src/app/Providers.tsx` composes the app providers in this order (outer→inner) and `src/index.tsx` renders it:
```tsx
<QueryClientProvider client={queryClient}>   // existing
  <ThemeProvider>                             // from theming-infra (applies data-theme / custom vars)
    <I18nProvider>                            // from i18n-infra (sets <html lang/dir>, provides t)
      <App />
    </I18nProvider>
  </ThemeProvider>
</QueryClientProvider>
```
(Order is not load-bearing, but keep it stable.)

**Router-scoped providers.** Providers that need router context (e.g. `ShortcutsProvider` from
`specs/shortcuts` uses `useNavigate`) must mount **inside** the Router, not in the stack above. Wire them via
the router root in `src/App.tsx`: `<Router root={AppRoot}>` where `AppRoot` renders
`<ShortcutsProvider>{props.children}</ShortcutsProvider>` (so it wraps every route and sits inside router
context). This edit is owned here too.

## The rules (apply in the sweep, and to all NEW components)

1. **Semantic color tokens only.** Use the tokens defined by theming-infra in `src/index.css`
   (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `border-line`, `bg-row-hover`, `bg-brand`,
   `text-on-brand`, `bg-danger`, …). **No** hardcoded colors (`bg-white`, `text-black`, `#hex`, arbitrary
   `bg-[#…]`) and **no `dark:` variants** (the `dark:` variant can't express custom user themes — themes swap
   token values instead).
2. **Logical CSS only** (so RTL mirrors automatically under `dir`):
   - spacing `ml/mr/pl/pr` → `ms/me/ps/pe`; position `left-/right-` → `start-/end-`;
     text `text-left/right` → `text-start/text-end`; borders `border-l/r` → `border-s/e`;
     radius `rounded-l/r` → `rounded-s/e`; `inset`/absolute panels use `inset-inline-start/end`.
   - flex/grid order mirrors automatically — leave it.
   - **Directional icons** (chevrons/arrows in Sidebar, TablePagination, drawer, etc.) mirror with
     `rtl:-scale-x-100`; non-directional icons (gear, search, comment) don't.
3. **Externalise strings** via i18n's `t("namespaced.key")` (namespaces `label.* action.* message.* status.*`),
   adding keys to `src/intl/dictionaries/en.ts` (+ translations). Route titles: `routeMeta.ts` returns keys,
   translated in the AppBar/MobileHeader via `t`.
4. **Presentational vs domain placement.** `src/components/**` is **generic, presentational UI only** — no
   gql.tada documents and no `useQuery`/`useMutation`. Domain/entity components that fetch data live in
   `src/system/<Entity>/` (`Components/` + `api/{operations.ts,use<Entity>.ts,index.ts}` + `index.ts`);
   cross-cutting non-entity hooks (e.g. `usePreferences`) live under their own top-level folder
   (`src/preferences/`). See `CLAUDE.md` → "Components vs `system/` modules".
5. **Every new/edited component obeys 1–4 from the start** (tell any future feature agents this).

## The component sweep (run once, after both infra)

Do all three transforms **in one pass per file** (tokens + logical + `t()`), so each shared file is touched
only once. Files: `src/components/layout/{Sidebar,NavContent,StoreBar,AppBar,MobileHeader,MobileDrawer,PageHeader}.tsx`,
`src/components/table/{DataTable,TablePagination,TableToolbar,FilterBar,SelectionFooter}.tsx`,
`src/layouts/AppLayout.tsx`, `src/components/icons.tsx` (directional mirroring), `src/routes/**` screens
(incl. stocktakes ListView/DetailView), `src/routes/routeMeta.ts` + AppBar/MobileHeader title translation.
Also swap the ad-hoc `formatDate` in stocktakes `columns.tsx` for i18n's `format.ts` helper.

Depends on **both** infra (needs the tokens from theming + `t`/dir from i18n) and should run **after** the
stocktakes port so it sweeps those files once too.

## Acceptance (sweep)

- `pnpm typecheck` + `pnpm build` pass. App renders under `Providers.tsx`.
- Grep clean: no `dark:`, no hardcoded colors (`bg-white|text-black|#[0-9a-fA-F]{3,6}|bg-\[#`), no physical
  directions (`\b(ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r|rounded-l|rounded-r)-`) in the
  swept files.
- Light, dark, a custom theme, and Arabic/RTL all render correctly **together** (theme × direction compose).
