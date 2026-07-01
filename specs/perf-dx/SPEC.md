# Spec — perf & DX: lazy dictionaries, lazy command palette, graphqlsp, linting

A small follow-up covering four items. Current state (verified on `main`):
- **Routes are already lazy** — `src/routes/registry.tsx` uses `lazy(() => import("./…"))` per screen, so the
  **Settings route is already code-split** (Part B only needs the command palette).
- **i18n dictionaries are NOT lazy** — `src/intl/I18nProvider.tsx` statically imports `en`, `ar`, `fr`, so all
  locales ship in the main bundle (Part A).
- **`@0no-co/graphqlsp` is already a dev dep** + `gql.tada/ts-plugin` is in `tsconfig.json` (Part C = verify +
  document, not install).
- **No linter/formatter** configured (Part C = add).

Target repo: `/Users/aneesh/Projects/rnd-the-fe`. Read `CLAUDE.md` first.

## Part A — Lazy-load non-active translation dictionaries

**Problem:** `I18nProvider.tsx` static-imports every dictionary → all locales are in the initial bundle.

**Fix:** keep the **default/base `en`** statically imported (it's the fallback + the source of the `Dictionary`
key type + avoids an empty first paint); load every other locale via **dynamic `import()`** so Vite splits it
into its own chunk fetched only when that locale is selected.
```ts
import { type Dictionary, en } from "./dictionaries/en"; // stays bundled (default + fallback + type)

const LOADERS: Record<Locale, () => Promise<Dictionary>> = {
  en: () => Promise.resolve(en),
  ar: () => import("./dictionaries/ar").then((m) => m.ar),
  fr: () => import("./dictionaries/fr").then((m) => m.fr),
};

// in the provider:
const [dict] = createResource(locale, (l) => LOADERS[l]());        // fetches the active locale's chunk
const flat = createMemo(() => i18n.flatten(dict() ?? en));         // fall back to en while loading (no flash)
const t = i18n.translator(flat, i18n.resolveTemplate);
```
- Remove the static `import { ar }` / `import { fr }`.
- While a non-default locale's chunk loads, `t` resolves against `en` (or last-loaded) so there's no flash of
  raw keys; it updates reactively when the resource settles.
- The persisted locale still shows instantly (en fallback) while its chunk arrives.

**Acceptance:** `pnpm build` emits separate chunks per non-default locale (e.g. `ar-*.js`, `fr-*.js`) that are
**not** in the entry chunk; switching to Arabic fetches its chunk once (visible in the network panel), then
strings + `dir` update.

## Part B — Lazy-load the command palette (routes already lazy)

**Routes:** already code-split via `lazy()` in `registry.tsx` — nothing to do for Settings. Just confirm the
router/`AppLayout` provides a `<Suspense>` fallback (a small loading state) so lazy route chunks don't flash
blank. Add one if missing.

**Command palette:** it's mounted globally by `ShortcutsProvider` but only shown when open — so lazy it so its
code (and the command-list building) loads on first Ctrl/⌘+K, not at startup:
```ts
const CommandPalette = lazy(() => import("./CommandPalette"));
// in ShortcutsProvider:
<Show when={isPaletteOpen()}>
  <Suspense fallback={null}>
    <CommandPalette … />
  </Suspense>
</Show>
```
Keep the global keydown listener + keybinding model **eager** (tiny); only the palette UI is deferred.

**Acceptance:** `pnpm build` puts the command palette in its own chunk (not the entry); it's fetched the first
time the palette opens. Settings is its own chunk (already).

## Part C — DX: graphqlsp + linting

**graphqlsp (already present — verify + document):** `@0no-co/graphql­sp` is in devDependencies and
`tsconfig.json` has `plugins: [{ name: "gql.tada/ts-plugin", schema, tadaOutputLocation }]`. Deliverable:
confirm it's there and add a short README/CONTRIBUTING note that editors must **use the workspace TypeScript
version** for the plugin (inline GraphQL diagnostics/autocomplete) to load; `npx gql.tada doctor` diagnoses
setup. Only `pnpm add -D @0no-co/graphqlsp` if it's somehow missing.

**Linting — add ESLint (flat) + `eslint-plugin-solid` + Prettier** (per `CLAUDE.md`; the Solid plugin catches
reactivity foot-guns like destructured props — high value for LLM-written code):
- `pnpm add -D eslint typescript-eslint eslint-plugin-solid eslint-config-prettier prettier`
- `eslint.config.js` (flat): typescript-eslint recommended + `eslint-plugin-solid` recommended (`solid/…`
  rules) + `eslint-config-prettier` last (disable stylistic conflicts). **Ignore** `dist/`, `node_modules/`,
  and the generated `src/graphql/graphql-env.d.ts`.
- `.prettierrc` matching the codebase (2-space, 110 print width, etc.).
- Scripts: `"lint": "eslint . "`, `"format": "prettier --write ."`, and optionally `"lint:fix"`.
- Alternative (documented, not chosen): **Biome** is a faster single-tool lint+format, but it lacks the
  Solid-specific reactivity rules — those are the reason we pick ESLint + `eslint-plugin-solid`. If the team
  later prefers speed over the Solid rules, swap to Biome.

**Acceptance:** `pnpm lint` runs clean (or with a known baseline) and flags a deliberately destructured-props
violation; `pnpm format` is idempotent; `graphql-env.d.ts` is ignored; `pnpm typecheck` still green.

## Coordination

- **Part A** edits `src/intl/I18nProvider.tsx` → run **after** i18n-infra (`specs/i18n`) lands.
- **Part B (palette)** edits `ShortcutsProvider`/`CommandPalette` → run **after** `specs/shortcuts` lands.
  (Routes are already lazy — no dependency there.)
- **Part C** is additive config (new `eslint.config.js`/`.prettierrc`/`package.json` deps) — independent, but
  run it **late** so it lints merged code; expect it to surface existing issues (fix or set an agreed
  baseline). Add the `graphql-env.d.ts` ignore so generated code isn't linted.
- Fold the lint scripts + "use workspace TS version" note into `CLAUDE.md`/README when done.
