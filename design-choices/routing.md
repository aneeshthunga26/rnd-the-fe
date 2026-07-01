# Design choice — Routing (typed ROUTES + layout-grouping registry)

**Decision:** use **`@solidjs/router`** with a **file-based-style** `src/routes/` tree (one folder per screen),
a single typed **`const ROUTES`** map, and a **registry** that builds the route tree by **grouping screens
under their layout**. Each screen may declare its own `layout` (defaults to `AppLayout`).

**Why:**
- **Type-safe paths** — `ROUTES.stocktakes` etc.; no raw path strings (mirrors open-mSupply's `AppRoute` enum,
  simpler). One source of truth, feeds nav links, redirects, and the command palette.
- **File-based-style organisation** — screens live in folders (`routes/inventory/stocktakes/…`) colocating
  their feature `api/`, `ListView`/`DetailView`, columns. Predictable for LLMs/devs.
- **Layout as a first-class, screen-chosen concern** — the registry groups routes by layout into pathless
  parent routes, so the shell (sidebar/app bar) **stays mounted** across navigation (no reflash) while the
  matched screen swaps under it.
- Lightweight — no meta-framework; it's an SPA.

## Costs / trade-offs
- **Manual registry** — routes are registered explicitly (not auto-discovered by a filesystem plugin). A tiny
  bit of boilerplate per screen, but fully typed and no build-time magic (matches CLAUDE's "minimal build-step
  magic").
- **`ROUTES` + `routeMeta` to maintain** — adding a screen means a `ROUTES` entry, a registry entry, and a
  title in `routeMeta`. Cheap, but three touch-points.
- **Router-scoped providers** — anything needing `useNavigate` (the command palette) must mount inside the
  Router (via `<Router root>`), not the outer provider stack — a subtlety captured in `../specs/conventions.md`.
- **Header ownership** — the layout owns the AppBar; screens contribute title/actions via a slot
  (`PageActions`), not by rendering the bar (this replaced an earlier "screen wraps AppBar" smell).

## Alternatives rejected
- **Filesystem-routing Vite plugin** — more magic, still needs a separate typed path map; less explicit.
- **SolidStart / file routes** — a meta-framework we don't need (client-only SPA, no SSR).

## Net
Explicit + typed beats magic here: `ROUTES` gives path safety, the registry gives persistent layouts and
per-screen layout choice, and folder-per-screen keeps features colocated. Cost is a little registration
boilerplate. Detail: `../CLAUDE.md`; screen-folder move in `../specs/refactor/SPEC.md` Part C.
