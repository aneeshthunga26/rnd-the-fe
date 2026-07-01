# Design choice — Framework (SolidJS, pinned to 1.9)

**Decision:** build on **SolidJS**, pinned to **stable `solid-js@^1.9`**. We tried Solid **2.0 beta** and
**rolled back**.

**Why Solid:** fine-grained reactivity (no VDOM diffing) → small runtime + strong performance, which serves the
bundle-size and time-to-network-quiet goals. Components run once; updates are surgical. Good TS story.

**Why 1.9, not 2.0:** we started on `solid-js@2.0.0-beta` (with `vite-plugin-solid@next`, `@solidjs/router@next`).
It broke on the ecosystem:
- 2.0 split the DOM renderer into a separate `@solidjs/web` package and **removed the `solid-js/store` and
  `solid-js/web` subpath exports**; libraries built for 1.x (TanStack `solid-virtual` imports `solid-js/store`,
  `solid-table` imports `solid-js/web`) fail to resolve.
- 2.0 also renames/removes core APIs (`createResource` gone, `onMount` gone, `Suspense`→`Loading`,
  `ErrorBoundary`→`Errored`, `batch` gone, `getState()`→`store.state`, etc.).
So the ecosystem isn't ready. We reverted to 1.9 (near-identical component code) and shipped.

## Costs / trade-offs
- **Smaller ecosystem than React** — fewer off-the-shelf components; we build more ourselves (tables, palette).
  Mitigated by headless libs (TanStack, Kobalte) that have Solid adapters.
- **Not on the newest APIs** — no 2.0 first-class async/`createAsync`, split effects, etc. Fine; 1.9 is stable
  and fully supported.
- **Mental-model shift for React devs** — components run once, no re-render; props are reactive proxies (don't
  destructure). Documented in `../docs/solidjs/` and `CLAUDE.md`.
- **A migration to 2.0 later** will be a real (if mechanical) effort once the ecosystem catches up.

## Net
Solid gives the performance/bundle profile we want; 1.9 gives it *stably today*. Revisit 2.0 when TanStack +
Kobalte publish 2.0-compatible releases. See `../docs/solidjs/README.md` (a `09-solid-2.0` deep-dive existed
and was removed on rollback).
