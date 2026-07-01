# CLAUDE.md — rnd-the-fe

Guiding principles for building this project. **Read this first, then read [`docs/solidjs/`](docs/solidjs/README.md)** before writing any Solid code.

## What this is

A **focused rewrite of the open-mSupply stocktake screen** in SolidJS — and *only* that screen. No auth pages, no app shell, no other features. The goal is to implement the stocktake screen cleanly and prove out a stack.

- The server already exposes all required GraphQL operations **without auth** (run with `debug_no_access_control: true`). Point the client at the open-mSupply server's `POST /graphql` and pass `storeId` as an argument on each operation.
- The **feature spec is the existing React implementation** at `open-msupply/client/packages/inventory/src/Stocktake/` and the schema at `open-msupply/server/schema.graphql`. Treat those as the source of truth for *what* to build — this file is about *how*.

## Goals (every decision serves these)

1. **Small bundle** — ship the minimum. Prefer the platform and Solid primitives over libraries.
2. **Performance** — fine-grained reactivity, virtualized tables, no needless re-fetching. The headline metric is *time-to-network-quiet* (when the data layer goes idle), not the `load` event — see `bench-prompt.md`.
3. **Responsiveness** — works on tablet and desktop; layout adapts.
4. **Type safety + maintainability** — end-to-end types from GraphQL to the DOM; no `any`.
5. **Velocity for LLMs and devs** — idiomatic, predictable patterns; minimal build-step magic; colocated, well-typed code an agent can extend without surprises.

When goals conflict, state the trade-off explicitly in code review or the PR — don't decide silently.

## Stack (and why)

> **We target stable Solid 1.x (`solid-js@^1.9`).** We tried Solid 2.0 (beta) and rolled back:
> its reactive core was split into a separate `@solidjs/web` package and the `solid-js/store` /
> `solid-js/web` subpaths were removed, which breaks ecosystem libraries that still import them
> (TanStack `solid-virtual` imports `solid-js/store`; `solid-table` imports `solid-js/web`). Until
> the ecosystem catches up, **stay on 1.x.** Verify each new dependency works on the installed
> Solid version before adding it.

| Concern | Choice | Rationale (vs goals) |
|---------|--------|----------------------|
| Framework | **Solid 1.x** (`solid-js@^1.9`) | Fine-grained reactivity → perf + small runtime. Stable, full ecosystem support. |
| Build | **Vite** + `vite-plugin-solid` | Fast dev loop (velocity); tiny, tree-shaken output. |
| Styling | **Tailwind v4** via `@tailwindcss/vite` (Oxide/Rust engine) | No runtime CSS cost; CSS-first `@theme` config; only used utilities ship. |
| Routing | **`@solidjs/router`** | Tiny; gives us URL-as-state for filters (a stated goal in the reference journey). |
| Table | **`@tanstack/solid-table`** (v8, stable) | Headless (no styling bundle), fully typed, framework-native adapter. Avoid the v9 beta — its API diverges from all the docs. |
| Virtualization | **`@tanstack/solid-virtual`** | Required for large stocktake-line lists → perf. Virtualize rows from the start. |
| GraphQL types | **`gql.tada`** (+ tiny `fetch` transport) | Full type inference straight from the schema with **zero per-operation codegen** (velocity, maintainability). Uses `@0no-co/graphql.web` (~5 KB) instead of `graphql-js` (~40 KB) → small bundle. One build step: `gql.tada generate output` refreshes the schema-introspection `.d.ts` for CI typecheck. Alternative if the editor plugin is a pain: graphql-codegen `client` preset. |
| Data fetching | **`@tanstack/solid-query`** | The cache/dedup/invalidation layer (mirrors what open-mSupply uses react-query for: refetch-after-mutation). gql.tada's inferred result/variables types flow into `useQuery`'s `queryFn`. ~12 KB gzip, consistent with the TanStack table/virtual stack. Use bare `createResource` only for trivial one-off reads. |
| Headless UI | **Kobalte** (minimal surface) | Accessible, tree-shakeable; import only what needs a11y/focus management (Dialog, Combobox/Select, Checkbox, NumberField). Plain styled elements for the rest. `corvu` is the fallback. |
| Theming | **CSS variables + `data-theme`** on `<html>`, mapped through Tailwind `@theme`; a `ThemeProvider` context with a persisted signal | Zero-JS theme swap; instant; no flash. |
| i18n | **`@solid-primitives/i18n`** | Tiny, reactive, typed dictionaries. Drive `lang`/`dir` on `<html>` from the locale signal. |
| RTL/LTR | `dir` attribute + **logical CSS** (Tailwind `ps-/pe-/ms-/me-`, `start`/`end`) | Layout mirrors automatically; never hardcode left/right. |
| Number/date/string | Native **`Intl`** (`NumberFormat`, `DateTimeFormat`, `Collator`, `PluralRules`) wrapped in locale-aware helpers | Locale-correct with **zero bundle cost**. |
| Lint/format | **ESLint (flat) + `eslint-plugin-solid`** + Prettier | The Solid plugin catches reactivity foot-guns (e.g. destructured props) — worth it for LLM-written code. (Biome is faster but loses the Solid-specific rules.) |
| Test | **Vitest** + `@solidjs/testing-library` | Light, Vite-native. |

### Adding a package — the bar

Default answer is **no**. Before adding any dependency, weigh it against the five goals and justify in the PR:
1. Can the platform (`Intl`, `fetch`, CSS, web APIs) or an existing dep already do this?
2. What does it cost the **bundle** (check bundlephobia / the actual built size)?
3. Is it **headless / tree-shakeable**, or does it drag in styling/runtime we don't control?
4. Does it **work on Solid 1.x** (check its peer deps and that it doesn't rely on 2.0-only APIs)?
5. Does it improve **types and velocity**, or add build-step magic an LLM will trip on?
Avoid React-shaped heavyweight state libraries — Solid's signals/stores are the state layer.

## Guiding principles

**Reactivity & components** (details in [`docs/solidjs/01`](docs/solidjs/01-reactivity.md), [`03`](docs/solidjs/03-components-lifecycle.md)):
- Components **run once** — there is no re-render. Don't reach for React habits.
- **Never destructure props** (breaks reactivity). Use `props.x`; `splitProps`/`mergeProps` when needed.
- Reactive values are **functions you call**. Read signals inside tracking scopes (JSX, effects, memos).
- Side effects go in `createEffect`; cleanup in `onCleanup`. Derive with `createMemo`, don't recompute in JSX.

**Rendering** ([`04`](docs/solidjs/04-control-flow.md), [`05`](docs/solidjs/05-jsx-rendering-events.md)):
- Use control-flow components (`<Show>`, `<For>`, `<Switch>`), not raw ternaries/`.map()` for dynamic UI.
- **`<For>` vs `<Index>`**: keyed-by-reference vs keyed-by-index — choose deliberately (`04` explains). Wrong choice = subtle bugs and lost perf.
- Logical CSS only; `class` not `className`; `classList`/`style` objects for dynamic styling.

**Data** ([`06`](docs/solidjs/06-async-resources-suspense.md), [`07`](docs/solidjs/07-router.md)):
- All GraphQL is **typed end-to-end** via `gql.tada` — inline `graphql(\`…\`)` documents, no untyped queries, no `any` on responses.
- Fetch through `@tanstack/solid-query` (`useQuery` with a `queryKey`); handle loading/error off the query object. `createResource` only for trivial one-off reads.
- **Filters and selection live in the URL** (search params via `@solidjs/router`) so state is shareable and back/forward works.
- **`schema.graphql` is a generated artifact** (the open-mSupply Rust server exports it via `export-graphql-schema`). Don't hand-edit it. Refresh our copy with `pnpm schema:pull` (from a sibling `open-msupply` checkout) or `pnpm schema:introspect` (against a running server); both regenerate `graphql-env.d.ts`.
- **Vertical structure:** one shared `src/graphql/` (init + client + schema + generated env); each feature/vertical owns its own `api/` folder with colocated documents. Share shapes across verticals with gql.tada **fragments** (compose via the `[Fragment]` arg, unmask with `readFragment`) — there is no shared generated types file to maintain.

**Data layer organisation** (per-vertical `api/` folder, mirrors open-mSupply; see `routes/inventory/stocktakes/api/`):
- `operations.ts` — gql.tada documents/fragments + inferred row types (the GraphQL contract).
- `keys.ts` — a **query-key factory scoped by storeId** (`makeXKeys(storeId)` → `base()`/`list()`/`paramList(p)`/`detail(id)`), prefix-composed so caches invalidate broadly (`base()`) or narrowly (`detail(id)`).
- `api.ts` — `getXQueries(storeId)` returning grouped fns (`get.list()` etc., higher-order thunks that capture params for the key); mutations added here as plain `async` fns.
- `useXApi.ts` — the **hub**: the one place that supplies `storeId` (config today, a store context later) and returns `{ ...getXQueries(storeId), storeId, keys }`. Nothing else needs to know where storeId comes from.
- query/mutation hooks (`useXs.ts`, `useUpdateX.ts`) — thin wrappers: `useQuery(() => ({ queryKey: api.keys.list(), queryFn: api.get.list() }))`; mutations call `useMutation` and invalidate `api.keys.base()` (broad) or `api.keys.detail(id)` (narrow) on success.
- `index.ts` — barrel; screens import hooks/types from `./api` and never touch `request()`/keys directly.
- **Screen files stay pure UI**: a `*Screen.tsx` route entry composes views; the list UI lives in `ListView.tsx` (later `DetailView.tsx`) and gets data via the vertical's hooks.

**State & i18n:**
- Server data in resources; nested editable UI state (the line-edit modal) in **stores**; simple flags in signals ([`02`](docs/solidjs/02-stores.md)).
- All user-facing strings go through i18n; all numbers/dates through the `Intl` helpers. No hardcoded English or `toLocaleString()` scattered around.

**Performance discipline:**
- Virtualize the lines table. Batch mutations (the API has `batchStocktake`). Avoid waterfalls — fire independent queries together.
- Measure before claiming a win; use the `perf-measure` protocol in `bench-prompt.md`.

**Code shape:** feature-folder layout, thin components, logic in typed hooks/primitives. Match the surrounding code's idioms. Keep files an agent can navigate.
- **Declare components as `export const Name: Component<Props> = (props) => { … }`** (use Solid's `Component` / `ParentComponent` type), not `export function`. This types props consistently and keeps the component-vs-helper distinction obvious.

## Pointers

- SolidJS reference (read these): [`docs/solidjs/README.md`](docs/solidjs/README.md) — reactivity, stores, components, control flow, JSX/events, async, and router (all Solid 1.x).
- Feature reference (what to build): `open-msupply/client/packages/inventory/src/Stocktake/`.
- API: `open-msupply/server/schema.graphql`; endpoint `POST /graphql` (server default port 8000 — confirm locally); use the `v3.0.0-RC` branch with `debug_no_access_control: true`.
- Perf protocol: `bench-prompt.md`.
