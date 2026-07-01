# Design choice — Code organisation (components vs system vs routes)

**Decision:** three layers with clear responsibilities (inspired by open-mSupply's `common` vs `system` vs
feature-package split):
- **`src/components/**`** — **generic, presentational** UI only. No GraphQL documents, no query/mutation hooks,
  no domain knowledge. (DataTable, Modal, Menu, AsyncCombobox, layout, icons, pagination, …)
- **`src/system/<Entity>/`** — **domain components that own their data**: each entity colocates
  `Components/<Entity>SearchInput.tsx` + `api/` (gql.tada `operations.ts` + hooks). Shared across features.
- **`src/routes/<area>/…`** — **screens**, one folder per screen, colocating that feature's `api/`,
  `ListView`/`DetailView`, columns (the stocktakes folder is the template).

**Why:**
- **Separation of concerns / reuse** — a generic combobox or table is reusable precisely because it knows
  nothing about data; a `MasterListSearchInput` that *does* fetch belongs with its query, not in a generic
  bucket. Keeps `components/` a clean, dependency-light primitive library.
- **Colocation where it helps** — a feature's screen + its queries live together (easy to find, delete, move);
  a shared domain entity's UI + query live together in `system/`.
- **Consistency** — every data module (feature or entity) uses the same `api/` pattern (operations → keys →
  hub → hooks → barrel), so navigation is uniform.

**Correction that prompted this:** the search inputs initially landed in `src/components/inputs/search/` with
their operations/hooks — a generic folder owning data. The refactor moves them to `src/system/<Entity>/` and
codifies the rule (`../specs/refactor/SPEC.md` Part B).

## Costs / trade-offs
- **More folders** — a `system/` layer + per-screen folders + per-vertical `api/`. Deliberate; the alternative
  (flat or data-in-components) doesn't scale and blurs reuse.
- **Judgement call per component** — "is this generic or domain?" Rule of thumb: **does it import a GraphQL
  document or a query hook? → `system/` (or a route `api/`). No data? → `components/`.**
- **Import-path churn** when something graduates from a screen to shared `system/`. Acceptable.

## Net
`components/` stays a pure primitive library; anything that touches data lives with its data (`system/` for
shared entities, `routes/**/api/` for features). Enforced by the "no `graphql(`/`useQuery` under
`components/**`" acceptance grep. Detail: `../specs/refactor/SPEC.md`, `../specs/conventions.md`, `../CLAUDE.md`.
