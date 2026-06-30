# SolidJS Reference (for Claude / AI coding agents)

A curated, code-dense reference for building with **SolidJS** in this repo (a **client-side
SPA — no SSR**). Each file is self-contained, optimized for an AI agent to consult while
writing Solid code, and sourced from the official docs (`docs.solidjs.com`), the Solid source
on GitHub, and—for 2.0—the shipped beta release notes, RFCs, and the `@solidjs/signals` package.

## ⚠️ Version note — read this first

There are two Solid worlds. **Default to 1.x.** Only use 2.0 APIs if the project's
`package.json` pins `solid-js@^2` / `2.0.0-beta.*` or `@solidjs/signals`.

- **Solid 1.x** (`solid-js@latest`, currently 1.9.x) — stable, what files `01`–`08` describe.
- **Solid 2.0** (`solid-js@next`, beta) — major breaking rewrite; see `09`. The two have
  different reactivity engines and several renamed/removed APIs (`createResource` removed,
  `<Suspense>`→`<Loading>`, `batch` removed, etc.). Do not mix them.

## Index

| # | File | Covers |
|---|------|--------|
| 01 | [01-reactivity.md](01-reactivity.md) | `createSignal`, `createEffect`, `createMemo`, `createComputed`/`createRenderEffect` timing, `on`, `batch`, `untrack`, `createRoot`, ownership, `onCleanup` |
| 02 | [02-stores.md](02-stores.md) | `createStore` (path setters, arrays), `produce`, `reconcile`, `unwrap`, `createMutable`; store-vs-signal guidance |
| 03 | [03-components-lifecycle.md](03-components-lifecycle.md) | **Components run once**, props proxies (`mergeProps`/`splitProps`/`children`), `onMount`/`onCleanup`, refs, context + TS typing, `lazy` |
| 04 | [04-control-flow.md](04-control-flow.md) | `<Show>`, `<For>` vs `<Index>`, `<Switch>`/`<Match>`, `<Dynamic>`, `<Portal>`, `<ErrorBoundary>`; why not `.map()`/ternaries |
| 05 | [05-jsx-rendering-events.md](05-jsx-rendering-events.md) | `render`, JSX-vs-React differences, delegated/`on:`/bound events, `classList`/`style`, `attr:`/`prop:`/`bool:`, `ref`, `use:` directives |
| 06 | [06-async-resources-suspense.md](06-async-resources-suspense.md) | `createResource`, `<Suspense>`/`<SuspenseList>`, `useTransition`/`startTransition`, `createDeferred`; data-fetching patterns |
| 07 | [07-router.md](07-router.md) | `@solidjs/router` — routing, params, navigation, lazy routes, and the data layer (`query`/`createAsync`/`action`) |
| 09 | [09-solid-2.0.md](09-solid-2.0.md) | **Solid 2.0** — new `@solidjs/signals` core, first-class async, deterministic batching, full rename/removal map, migration notes |

## How to use these (for an agent)

1. Check the project's `solid-js` version first. If `1.x` (or unspecified), use `01`–`07`.
2. The single biggest mental-model shift from React: **components run once** (`03`), and
   everything reactive is a function you call to read (`01`). Don't destructure props.
3. For lists, pick `<For>` vs `<Index>` deliberately (`04`) — wrong choice causes subtle bugs.
4. For async data in plain Solid use `createResource` + `<Suspense>` (`06`); in a router app
   prefer the router data APIs (`07`).
5. Treat every 2.0 API (`09`) as beta — verify before relying on it.

> **No SSR:** this project is a client-side SPA, so SolidStart / server-rendering is intentionally
> excluded. Ignore `"use server"`, hydration, and streaming-SSR guidance from upstream docs.

## Sources

- Official docs: https://docs.solidjs.com
- Core: https://github.com/solidjs/solid
- Solid 2.0 reactive core: https://github.com/solidjs/signals
- Router: https://github.com/solidjs/solid-router
