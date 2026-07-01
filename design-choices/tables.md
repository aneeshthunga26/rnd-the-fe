# Design choice — Tables (TanStack Table v8 + solid-virtual + custom DataTable)

**Decision:** use **`@tanstack/solid-table` v8** (headless) for table state + **`@tanstack/solid-virtual`** for
row virtualization, wrapped in a single reusable **`components/table/DataTable`**. All tables (stocktakes list,
detail lines) render through `DataTable`.

**Why:**
- **Headless** — TanStack provides sorting/filtering/pagination/selection/column visibility-order-pinning-sizing
  as state; we own the markup + Tailwind styling. No styling bundle, full control, matches the "style it
  ourselves" stance.
- **One `DataTable` for every table** — features (selection, density, virtualization, column menus) are built
  once and reused; feature screens just supply columns + a table instance.
- **Virtualization** for large row counts (stocktake lines) → perf.
- v8 (stable) chosen over the v9 beta to avoid churn (v9's feature API diverges from all docs; see below).

**vs open-mSupply:** they use **Material-React-Table** (built-in column menus, density, fullscreen, pinning).
We replicate that *behaviour* on TanStack v8 + custom menus (see `../specs/stocktakes/03/04/05`), rather than
adopt MRT (React + MUI + heavier).

## Costs / trade-offs
- **We build the chrome** — column show/hide menu, settings menu, fullscreen, selection footer, density,
  pagination are all hand-built on the table instance (MRT gives these free). More code, but styled + owned.
- **Virtualization is desktop-only** — the `DataTable` mobile **card** branch renders a page of cards
  unvirtualized (bounded by server page size). Fine at modest page sizes; documented.
- **Virtualization ≠ everywhere** — dropdowns/comboboxes aren't virtualized (bounded by a server `first` cap +
  typeahead instead). See `../specs/refactor/SPEC.md` Part D and the "when to virtualize" note in `CLAUDE.md`.
- **v8, not v9** — we forgo v9's newer feature-composition API to stay on stable/well-documented ground.
- **Solid adapter gotcha** — table options must use reactive getters (`get data()` / `get state()`), the #1
  solid-table mistake; encoded in the specs.

## When to virtualize (rule)
Virtualize any list/table that can render **>~100 rows/nodes at once**. If already bounded small (server page,
capped dropdown, fixed set), plain render. Bound first, virtualize when the visible count can still grow large.

## Net
Headless TanStack + a shared `DataTable` gives full control and one place for all table features; cost is
building the chrome ourselves and being deliberate about *where* virtualization applies.
