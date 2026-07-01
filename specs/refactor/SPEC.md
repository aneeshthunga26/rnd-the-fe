# Spec — structure refactor: presentational vs domain components, screen folders, query-invalidation polish

A **consolidation pass** to run **after** the in-flight specs (`stocktakes`, `i18n`, `theming`, `shortcuts`)
have merged — it relocates files those specs create, so doing it earlier would fight them. Three parts:

- **A.** Small react-query invalidation polish (from the sanity check).
- **B.** Pattern change: `src/components/**` becomes **presentational-only**; domain components that need
  data move to a `src/system/<Entity>/` layer that colocates the component + its GraphQL ops/hooks
  (inspired by open-mSupply's `system` package).
- **C.** Move the flat dummy screens into **per-screen folders**, like `routes/inventory/stocktakes/`.

Target repo: `/Users/aneesh/Projects/rnd-the-fe`. Read `CLAUDE.md` + `../conventions.md` first.

---

## Part A — Query invalidation polish (optional but recommended)

From the data-layer sanity check — the only concrete tweak: narrow the broad invalidations.
- `src/routes/inventory/stocktakes/api/useUpdateStocktake.ts`: on success invalidate
  `api.keys.detail(id())` **and** `api.keys.list()` instead of `api.keys.base()` (a field/status edit only
  affects that stocktake's detail + the lists, not every store's cache).
- `useCreateStocktake.ts` / `useStocktakeDelete.ts`: `api.keys.list()` is sufficient (they change lists, not
  a specific detail) — `base()` is acceptable but broader than needed.
- Leave `useSaveStocktakeLines.ts` / `useStocktakeDeleteLines.ts` at `api.keys.detail(id())` (correct —
  prefix-matches the `lines` key). Add a `keys.list()` invalidation there too if counts shown in the list
  need to refresh.
Everything else in the GraphQL/query layer passed review — no other changes.

## Part B — Presentational components vs domain (data-owning) components

**Problem:** `src/components/inputs/search/` currently colocates GraphQL documents + query hooks with the
components (`operations.ts`, `usePreferences.ts`, entity `*SearchInput.tsx`). Generic component folders should
not own data.

**Inspiration (open-mSupply):** the `system` package gives each entity its own module that colocates the UI
with its data, e.g. `/Users/aneesh/Projects/open-msupply/client/packages/system/src/MasterList/` →
`Components/MasterListSearchInput.tsx` + `api/{operations.graphql, hooks/{keys.ts,useMasterLists.ts}, index.ts}`
+ `index.ts`. Truly-generic UI lives elsewhere (`common/ui/components`). We mirror that split.

**Rule (codify in `CLAUDE.md` + `../conventions.md`):**
- `src/components/**` = **generic, presentational, reusable UI only** — **no** gql.tada documents, **no**
  query/mutation hooks, no domain knowledge. (DataTable, Modal, Menu, AsyncCombobox, layout, icons, etc.)
- **Domain/entity components that need data** live in **`src/system/<Entity>/`**, each colocating
  `Components/<Entity>SearchInput.tsx` + `api/` (`operations.ts` gql.tada docs, `use<Entity>.ts` hook,
  `index.ts`) + a module `index.ts` barrel. This is the same per-vertical `api/` pattern used by
  `routes/inventory/stocktakes/api/` (hub/keys/hooks), just for shared domain entities.
- Feature screens keep colocating their own `api/` under their route folder (as stocktakes already does).

**Target layout:**
```
src/components/inputs/
  AsyncCombobox.tsx        # generic primitive — STAYS (no data)
  LanguageSelect.tsx       # app UI, no GraphQL — STAYS
  index.ts
src/system/
  MasterList/     { Components/MasterListSearchInput.tsx, api/{operations.ts,useMasterLists.ts,index.ts}, index.ts }
  Location/       { Components/LocationSearchInput.tsx,   api/{operations.ts,useLocations.ts,index.ts},    index.ts }
  VvmStatus/      { Components/VVMStatusSearchInput.tsx,  api/{operations.ts,useVvmStatuses.ts,index.ts},  index.ts }
  ReasonOption/   { Components/ReasonOptionsSearchInput.tsx, getReasonOptionTypes.ts, api/{…}, index.ts }
  Item/           { Components/StockItemSearchInput.tsx,  api/{operations.ts,useStockItems.ts,index.ts},   index.ts }
  Name/           { Components/{DonorSearchInput,ManufacturerSearchInput}.tsx, api/{…}, index.ts }  # both use `names`
  Campaign/, Program/  (or a shared CampaignOrProgram module) { Components/CampaignOrProgramSelect.tsx, api/{…} }
src/preferences/usePreferences.ts   # cross-cutting; not an entity search input
```

**Migration steps:**
1. Move each entity `*SearchInput.tsx` from `src/components/inputs/search/` into `src/system/<Entity>/Components/`.
2. Split `src/components/inputs/search/operations.ts` into per-entity `src/system/<Entity>/api/operations.ts`
   (each keeps its gql.tada fragment/document + `ResultOf` row type). Move each entity's query hook into
   `src/system/<Entity>/api/use<Entity>.ts` (a small `useQuery`, reusing `STORE_ID`/a hub as the stocktakes
   `api/` does). Move `getReasonOptionTypes.ts` into `system/ReasonOption/`, `usePreferences.ts` into
   `src/preferences/`.
3. Each `system/<Entity>/index.ts` re-exports its `SearchInput` + row type; consumers import
   `import { MasterListSearchInput } from "../../system/MasterList"` (update create-modal, line-edit,
   change-location, detail imports).
4. Delete the now-empty `src/components/inputs/search/`. `AsyncCombobox` + `LanguageSelect` remain in
   `src/components/inputs/`.
5. Update `specs/stocktakes/01-search-inputs.md` + `CLAUDE.md` + `../conventions.md` so future search inputs
   are authored under `src/system/<Entity>/` from the start (not `src/components/`).

## Part C — Screen folders (one folder per screen, like stocktakes)

Move each flat screen file into its own area folder (matching `routes/inventory/stocktakes/`):
```
routes/DashboardScreen.tsx      → routes/dashboard/DashboardScreen.tsx
routes/ReplenishmentScreen.tsx  → routes/replenishment/ReplenishmentScreen.tsx
routes/DistributionScreen.tsx   → routes/distribution/DistributionScreen.tsx
routes/DispensaryScreen.tsx     → routes/dispensary/DispensaryScreen.tsx
routes/ReportsScreen.tsx        → routes/reports/ReportsScreen.tsx
routes/CatalogueScreen.tsx      → routes/catalogue/CatalogueScreen.tsx
routes/SettingsScreen.tsx       → routes/settings/SettingsScreen.tsx      (theming already adds routes/settings/**; consolidate here)
routes/SyncScreen.tsx           → routes/sync/SyncScreen.tsx
routes/HelpScreen.tsx           → routes/help/HelpScreen.tsx
routes/inventory/StockScreen.tsx     → routes/inventory/stock/StockScreen.tsx
routes/inventory/LocationsScreen.tsx → routes/inventory/locations/LocationsScreen.tsx
```
- Update the import paths in `src/routes/registry.tsx` to the new locations.
- Keep `src/routes/_Placeholder.tsx` shared at the `routes/` root (used by all placeholder screens).
- Each screen folder later hosts that area's `api/`, `ListView`/`DetailView`, columns, etc. as it grows —
  the stocktakes folder is the template.

## Part D — Virtualization & dropdown caps

Audit finding: the only virtualization is `DataTable`'s **desktop** body (`createVirtualizer`), which covers
both tables (list + detail lines). The gaps to address:

- **Donor / Manufacturer (`names`) dropdowns** — currently `first: 1000`, so up to 1000 unvirtualized
  `<li>` options render on first open. They already server-filter (`codeOrName like`), so **lower the cap to
  ~50** and rely on the typeahead. Files: `.../inputs/search/{DonorSearchInput,ManufacturerSearchInput}.tsx`
  (post Part-B: `src/system/Name/...`).
- **Location dropdown** — verify it caps results **and** filters server-side (grep found no `first` /
  `serverSide` / `like` on `LocationSearchInput`); if it fetches all locations, add a `first` cap + a
  `codeOrName`/`name like` server filter like the other inputs. Don't render an unbounded location list.
- **Combobox virtualization (optional)** — for any dropdown that can still legitimately show many options,
  virtualize the Kobalte `Combobox` listbox (Kobalte supports a virtualized listbox) rather than raising caps.
  Not needed for StockItem (100 + server-filtered = fine).
- **Mobile card list** — `DataTable`'s `< md` branch renders the page's cards with a plain `<For>` (not
  virtualized). Fine while page sizes stay modest (server-paginated ~20). If any screen uses a large/"all"
  page size on mobile, reuse the existing virtualizer for the card list (estimate a card height). Leave as-is
  otherwise — just documented.

None of these are correctness bugs; they're DOM/perf bounds. StockItem search is already fine.

## Coordination / when to run

- **Run after** `stocktakes`, `i18n`, `theming`, `shortcuts` merge (this moves the search inputs spec-01
  creates, the screens, and the Settings folder theming creates). Doing it as one consolidation branch avoids
  churn while those are in flight.
- **Durable doc updates** are part of this refactor's deliverables: fold the Part-B rule into `CLAUDE.md`
  ("Data layer organisation" + a new "Components vs system modules" note) and `../conventions.md`, and fix the
  target paths in `specs/stocktakes/01-search-inputs.md`, so new work follows the layout automatically.

## Acceptance

- `pnpm typecheck` + `pnpm build` pass; `pnpm dev` unchanged in behaviour (pure reorg + the Part-A tweak).
- Grep: **no** gql.tada `graphql(` documents or `useQuery`/`useMutation` under `src/components/**` (they now
  live in `src/system/**` or a route's `api/`). `src/routes/*Screen.tsx` flat files are gone (each screen is a
  folder). `registry.tsx` imports resolve.
- `useUpdateStocktake` invalidates `detail(id)`+`list()` (not `base()`); other invalidations reviewed per Part A.
- Per Part D: `names` dropdowns capped (~50) not 1000; `LocationSearchInput` caps + server-filters (no
  unbounded list); no unvirtualized list renders more than its server cap of option nodes.
