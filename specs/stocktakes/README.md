# Stocktakes port — implementation specs (for parallel agents)

Goal: port **all functionality** of the open-mSupply Stocktakes area (list view, create modal, detail
view, line-edit modal, all mutations) into this SolidJS rewrite, **following the rewrite's existing
patterns**. Styling is already done — **match the current look, port functionality only. Do not add
MUI or copy open-mSupply's visual code.**

Read this whole file first, then your assigned unit spec (`00`–`10`).

## The two repos

- **This repo (target):** `/Users/aneesh/Projects/rnd-the-fe` — Solid 1.9, Vite, `@solidjs/router`,
  `@tanstack/solid-table` v8, `@tanstack/solid-virtual`, **gql.tada + `@tanstack/solid-query`**,
  Tailwind v4. Read `/Users/aneesh/Projects/rnd-the-fe/CLAUDE.md` (conventions) before coding.
- **Reference (source of behaviour, NOT code to copy):** open-mSupply React client under
  `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/`, shared code under
  `/Users/aneesh/Projects/open-msupply/client/packages/common/src/` and `.../system/src/`, and the
  GraphQL schema at `/Users/aneesh/Projects/open-msupply/server/schema.graphql`.
  open-mSupply uses React + MUI + Material-React-Table + graphql-request + react-query. **We reimplement
  the behaviour with our stack** (Solid + TanStack Table v8 + a custom `DataTable` + gql.tada). Use the
  reference for: fields, flows, GraphQL operations, validation, error handling — not styling or library APIs.

## Current rewrite map (what already exists — reuse it)

```
src/graphql/            graphql.ts (gql.tada init), client.ts (request()), config.ts (GRAPHQL_URL, STORE_ID, USE_MOCK), graphql-env.d.ts (generated)
src/lib/                breakpoints.ts, useMediaQuery.ts (useIsMobile)
src/components/layout/  Sidebar, NavContent, StoreBar, AppBar, MobileHeader, MobileDrawer, PageHeader (PageActions/useHeaderActions)
src/components/table/   DataTable.tsx, TablePagination.tsx, TableToolbar.tsx (the 3 buttons), FilterBar.tsx
src/components/icons.tsx
src/layouts/AppLayout.tsx     (owns AppBar via PageHeader; desktop sidebar / mobile top+bottom bar)
src/routes/             routes.ts (ROUTES const), registry.tsx (buildRoutes by layout), routeMeta.ts (titles), *Screen.tsx
src/routes/inventory/stocktakes/
    StocktakesScreen.tsx      (thin route entry → <ListView/>)
    ListView.tsx              (list UI: PageActions, FilterBar, TableToolbar, DataTable, TablePagination, mobile cards)
    columns.tsx               (col defs + formatDate)
    mockData.ts               (TO BE DELETED in 00-foundation)
    api/  operations.ts (gql docs + StocktakeRow), api.ts (getStocktakeQueries(storeId)), keys.ts (makeStocktakeKeys), useStocktakeApi.ts (hub), useStocktakes.ts, index.ts (barrel)
```

## Global conventions (every unit follows these)

- **Data layer** = the per-vertical `api/` folder pattern documented in `CLAUDE.md` → "Data layer
  organisation": `operations.ts` (gql.tada docs + types) → `keys.ts` (storeId-scoped key factory) →
  `api.ts` (`getStocktakeQueries(storeId)` fns) → `useStocktakeApi.ts` (hub) → `useX.ts` hooks →
  `index.ts` barrel. Mutations are `useMutation` hooks that invalidate `api.keys.base()` (broad) or
  `api.keys.detail(id)` (narrow). Screens import from `./api`, never call `request()`/keys directly.
- **gql.tada**: add documents/fragments to `api/operations.ts`; type rows via `ResultOf`; compose
  fragments with the `[Fragment]` arg and unmask with `readFragment`. After adding/editing documents,
  run `pnpm gql:generate` (or just `pnpm typecheck`, which runs it) so `graphql-env.d.ts` is current.
- **storeId** comes from the hub (`STORE_ID` config today). Every operation takes `storeId`.
- **Components**: `export const Name: Component<Props> = (props) => …` (never `export function`); read
  `props.x` (don't destructure); use `<Show>/<For>/<Switch>`; Tailwind classes matching existing files.
- **No mock**: `00-foundation` deletes `mockData.ts` + `USE_MOCK`. Do not reintroduce mock data.
- **Modals/menus**: use the shared primitives from `00-foundation` (`src/components/ui/Modal.tsx`,
  `Menu.tsx`, `ConfirmModal.tsx` — Kobalte-backed). Do not hand-roll dialogs.
- **Verify**: `pnpm typecheck` and `pnpm build` must pass. Run `pnpm dev` and exercise your feature
  against the real server (see "Running" below). Do not commit.

## Running against the real API

There is no mock anymore. Point at the open-mSupply dev server:
- `.env` already has `VITE_GRAPHQL_URL=http://localhost:8000/graphql` and
  `VITE_STORE_ID=5B28901C52396E4BB098B9862CCF5DF9`. Run that server from the `v3.0.0-RC` branch with
  `debug_no_access_control: true`. Refresh the schema snapshot with `pnpm schema:pull` if types drift.
- Reference stocktake id for detail testing: `019f17d0-1444-795c-ac53-da2216c73cff`.

## Dependency graph & parallelization

```
                 ┌────────────────────────── 00 FOUNDATION (do first, alone) ──────────────────────────┐
                 │ server params + remove mock + DataTable state upgrade + Modal/Menu/Confirm + urlParams │
                 └───────────────────────────────────────────┬─────────────────────────────────────────┘
                                                              │  (everything below needs 00)
        ┌───────────────┬───────────────┬───────────────┬────┴──────┬───────────────┬───────────────────────────┐
        ▼               ▼               ▼               ▼           ▼               ▼
   01 SEARCH-INPUTS  02 SELECTION+   03 COLUMNS      04 FULLSCREEN  05 TABLE       06 CREATE MODAL   ┌── DETAIL TRACK ──┐
   (async combobox +    DELETE        MENU           (2nd button)   SETTINGS       (needs 00,01)     │ 07 SCAFFOLD       │
    entity inputs)   (footer del/    (1st button)                  (gear/3rd)                        │  (needs 00)      │
                      clear)                                                                          │   ├─08 LINES TABLE│
                                                                                                      │   ├─09 LINE EDIT  │
                                                                                                      │   │   (needs 07,01)│
                                                                                                      │   └─10 FOOTER     │
                                                                                                      │       (needs 07)  │
                                                                                                      └───────────────────┘
```

**Wave 1 (serial):** `00-foundation`. Merge before anything else starts.
**Wave 2 (parallel, after 00):** `01-search-inputs`, `02-selection-and-delete`, `03-columns-menu`,
`04-fullscreen`, `05-table-settings`, `07-detail-scaffold`.
**Wave 3 (parallel, after their deps):** `06-create-modal` (after 01), `08-detail-lines-table` (after 07),
`09-line-edit-modal` (after 07 + 01), `10-detail-footer-actions` (after 07).

### File-ownership matrix (avoid collisions)

| Unit | Creates (owns) | Edits (shared — keep edits minimal & localized) |
|---|---|---|
| 00 | `components/ui/{Modal,Menu,ConfirmModal}.tsx`, `lib/useUrlQueryParams.ts`, `components/table/SelectionFooter.tsx` | `components/table/DataTable.tsx`, `.../TablePagination.tsx`, `stocktakes/api/*`, `stocktakes/ListView.tsx`, `stocktakes/columns.tsx`, `graphql/config.ts`, `.env`, `vite-env.d.ts`, delete `mockData.ts`, `package.json` (kobalte) |
| 01 | `components/inputs/AsyncCombobox.tsx` + `system/` entity inputs & their `api/` docs | — |
| 02 | `stocktakes/api/useStocktakeDelete.ts` | `stocktakes/ListView.tsx` (footer-actions slot only) |
| 03 | `components/table/ColumnPickerMenu.tsx` | `stocktakes/ListView.tsx` (columns-button handler only) |
| 04 | `components/table/useFullscreen.tsx` + `FullscreenContainer.tsx` | `stocktakes/ListView.tsx` (fullscreen-button + wrapper only) |
| 05 | `components/table/TableSettingsMenu.tsx`, `lib/persistTableState.ts` | `stocktakes/ListView.tsx` (settings-button handler only) |
| 06 | `stocktakes/CreateStocktakeModal.tsx`, `stocktakes/api/useCreateStocktake.ts` (+ operations) | `stocktakes/ListView.tsx` (New button handler only) |
| 07 | `stocktakes/DetailView/*` (scaffold, SidePanel, Toolbar), `stocktakes/api/useStocktake.ts`, `useStocktakeLines.ts`, `useUpdateStocktake.ts` (+ operations, detail fragments) | `routes/routes.ts` (+detail path), `routes/registry.tsx` (+route), `routeMeta.ts` |
| 08 | `stocktakes/DetailView/lineColumns.tsx`, lines table wiring in `DetailView` | (07's DetailView — coordinate; 08 owns lines table region) |
| 09 | `stocktakes/DetailView/modal/*` (line edit), `stocktakes/api/useSaveStocktakeLines.ts` (+ line operations), `context/stocktakeLineError.tsx` | (07's DetailView — opens modal from a row-click handler) |
| 10 | `stocktakes/DetailView/Footer/*`, confirmation modals, `useStocktakeDeleteLines.ts`, `useZeroStocktakeLines.ts`, `useChangeLinesLocation.ts` | (07's DetailView — footer slot) |

> `ListView.tsx` is touched by 02/03/04/05/06. `00` must leave **clearly-labelled slots** in ListView
> (a `// TOOLBAR: columns button`, `// TOOLBAR: fullscreen button`, `// TOOLBAR: settings button`,
> `// FOOTER: selection actions`, `// ACTIONS: new stocktake` — see 00) so each Wave-2 unit fills exactly
> one slot. Likewise `07` leaves labelled slots in `DetailView` for `08/09/10`. Orchestrator: prefer
> merging ListView-touching units sequentially, or have one agent own ListView wiring after the others
> land their components.

## Acceptance (whole port)

Feature parity with the screenshots + open-mSupply: server-side filter/sort/pagination; row selection
with header select-all and a below-table Delete/Clear footer; columns show/hide/reorder/pin menu;
fullscreen mode; table settings menu; create-stocktake modal (full/filtered/blank); detail view with
editable side panel, lines table, line-edit modal (batch/pricing/other tabs), finalise/lock, reduce-to-zero,
change-location, delete-lines, and structured error handling. `pnpm typecheck` + `pnpm build` green.
