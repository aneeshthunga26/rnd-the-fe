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

> **Solid 2.0 is beta.** This is the one place we accept ecosystem risk. The TanStack Solid adapters
> (`solid-table`, `solid-virtual`) **already support Solid 2.0**. Some other libraries (e.g. Kobalte)
> still primarily target Solid **1.x** and may not yet be 2.0-compatible.
> **Mitigation:** pin exact versions; if a core library breaks on 2.0, fall back to `solid-js@1.9.x`
> (the patterns in `docs/solidjs/01`–`07` are identical; only `09` is 2.0-specific). Verify each new
> dependency against the installed Solid major before adding it.

| Concern | Choice | Rationale (vs goals) |
|---------|--------|----------------------|
| Framework | **Solid 2.0** (`solid-js@next`) | Fine-grained reactivity → perf + small runtime. Beta — see warning above. |
| Build | **Vite** + `vite-plugin-solid` | Fast dev loop (velocity); tiny, tree-shaken output. |
| Styling | **Tailwind v4** via `@tailwindcss/vite` (Oxide/Rust engine) | No runtime CSS cost; CSS-first `@theme` config; only used utilities ship. |
| Routing | **`@solidjs/router`** | Tiny; gives us URL-as-state for filters (a stated goal in the reference journey). |
| Table | **`@tanstack/solid-table`** | Headless (no styling bundle), fully typed, framework-native adapter. |
| Virtualization | **`@tanstack/solid-virtual`** | Required for large stocktake-line lists → perf. Virtualize rows from the start. |
| GraphQL types | **`gql.tada`** + **`graphql-request`** | Full type inference straight from `server/schema.graphql` with **zero generated files** (velocity, maintainability); `graphql-request` is a ~tiny client (small bundle). Alternative if the editor plugin is a pain: graphql-codegen `client` preset. |
| Data fetching | **Solid's own async** (`createResource` in 1.x / async `createMemo` in 2.0) | Built-in → no extra bundle. Only add `@tanstack/solid-query` if we genuinely need cross-route caching/dedup — justify it first. |
| Headless UI | **Kobalte** (minimal surface) | Accessible, tree-shakeable; import only what needs a11y/focus management (Dialog, Combobox/Select, Checkbox, NumberField). Plain styled elements for the rest. `corvu` is the fallback. Check 2.0 compat. |
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
4. Is it **Solid 2.0-compatible** (or do we accept a pin/fallback)?
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
- All GraphQL is **typed end-to-end** — no untyped queries, no `any` on responses.
- Fetch with Solid resources; wrap loading/error in `<Suspense>`/`<ErrorBoundary>`.
- **Filters and selection live in the URL** (search params via `@solidjs/router`) so state is shareable and back/forward works.

**State & i18n:**
- Server data in resources; nested editable UI state (the line-edit modal) in **stores**; simple flags in signals ([`02`](docs/solidjs/02-stores.md)).
- All user-facing strings go through i18n; all numbers/dates through the `Intl` helpers. No hardcoded English or `toLocaleString()` scattered around.

**Performance discipline:**
- Virtualize the lines table. Batch mutations (the API has `batchStocktake`). Avoid waterfalls — fire independent queries together.
- Measure before claiming a win; use the `perf-measure` protocol in `bench-prompt.md`.

**Code shape:** feature-folder layout, thin components, logic in typed hooks/primitives. Match the surrounding code's idioms. Keep files an agent can navigate.

## Pointers

- SolidJS reference (read these): [`docs/solidjs/README.md`](docs/solidjs/README.md) — reactivity, stores, components, control flow, JSX/events, async, router, and a **Solid 2.0** deep-dive with a beta disclaimer.
- Feature reference (what to build): `open-msupply/client/packages/inventory/src/Stocktake/`.
- API: `open-msupply/server/schema.graphql`; endpoint `POST /graphql` (server default port 8000 — confirm locally); use the `v3.0.0-RC` branch with `debug_no_access_control: true`.
- Perf protocol: `bench-prompt.md`.
