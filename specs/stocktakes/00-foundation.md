# 00 — Foundation (Wave 1, do first, alone)

Everything else depends on this. It removes the mock, moves the list to **server-side** filter/sort/
pagination, upgrades `DataTable` to a controlled, feature-complete table (selection, visibility, order,
pinning, sizing, density), adds shared **Modal/Menu/Confirm** primitives + a `useUrlQueryParams` hook +
a generic `SelectionFooter`, and leaves **labelled slots** in `ListView` for the Wave-2 units.

Read `README.md` first. Reference (behaviour only, do not copy code):
- List table infra: `/Users/aneesh/Projects/open-msupply/client/packages/common/src/ui/layout/tables/usePaginatedMaterialTable.tsx`, `.../useBaseMaterialTable.tsx`, `.../tableState/*`
- URL params: `/Users/aneesh/Projects/open-msupply/client/packages/common/src/hooks/useUrlQuery/useUrlQueryParams.ts`
- List query doc: `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/operations.graphql`
- Schema: `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## 1. Add Kobalte (accessible primitives)

`pnpm add @kobalte/core`. Used for Dialog/DropdownMenu/Popover. (CLAUDE.md already selects Kobalte.)
If Kobalte fights Solid 1.9, fall back to minimal hand-rolled accessible components — but prefer Kobalte.

## 2. Remove the mock, fully

- Delete `src/routes/inventory/stocktakes/mockData.ts`.
- `src/graphql/config.ts`: remove `USE_MOCK`.
- `.env` + `src/vite-env.d.ts`: remove `VITE_USE_MOCK`.
- `src/routes/inventory/stocktakes/api/api.ts`: drop the `USE_MOCK` branch; `get.list` always calls the server.
- README/CLAUDE mock references: leave for a later cleanup (out of scope), just don't reference mock in code.

## 3. Server-side list query (filter / sort / pagination)

Edit `src/routes/inventory/stocktakes/api/operations.ts` — give `StocktakesDocument` the args
(mirror `.../Stocktake/api/operations.graphql`):
```graphql
query stocktakes($storeId: String!, $filter: StocktakeFilterInput, $page: PaginationInput, $sort: [StocktakeSortInput!]) {
  stocktakes(storeId: $storeId, filter: $filter, page: $page, sort: $sort) {
    ... on StocktakeConnector { totalCount nodes { ...StocktakeRow } }
  }
}
```
Schema shapes (from `server/schema.graphql`) — add typed param objects:
- `StocktakeFilterInput`: `{ status?: EqualFilterStocktakeStatusInput, createdDatetime?: DatetimeFilterInput, description?: StringFilterInput, comment?: StringFilterInput, isLocked?: Boolean, … }`
- `EqualFilterStocktakeStatusInput`: `{ equalTo?: StocktakeNodeStatus }` (status ∈ `NEW | FINALISED`)
- `DatetimeFilterInput`: `{ afterOrEqualTo?, beforeOrEqualTo?, equalTo? }` (DateTime ISO)
- `StringFilterInput`: `{ like?: String, equalTo?: String }`
- `StocktakeSortInput`: `{ key: StocktakeSortFieldInput!, desc?: Boolean }`; sortable keys:
  `stocktakeNumber | status | description | comment | createdDatetime | finalisedDatetime | stocktakeDate`
- `PaginationInput`: `{ first?: Int, offset?: Int }`

Define a `StocktakeListParams` type: `{ first: number; offset: number; sortBy?: { key: string; desc: boolean }; filterBy?: StocktakeFilterInput }`.

`api.ts` — `get.list(params: StocktakeListParams)` returns a thunk that calls
`request(StocktakesDocument, { storeId, page: { first, offset }, sort: sortBy ? [{ key, desc }] : undefined, filter: filterBy })`
and returns `{ rows: StocktakeRow[]; totalCount: number }` (return totalCount for server pagination).
`keys.ts` — use `paramList(params)` for the query key.
`useStocktakes.ts` — accept `params` and key off `api.keys.paramList(params)`; `queryFn: api.get.list(params)`.
Keep `placeholderData: keepPreviousData` (from `@tanstack/solid-query`) so page/filter changes don't flash.

## 4. `src/lib/useUrlQueryParams.ts`

A Solid hook over `@solidjs/router`'s `useSearchParams` that owns list state in the URL and maps to
`StocktakeListParams`. Model on `useUrlQueryParams.ts` (reference). Provide:
```ts
useUrlQueryParams(opts?: { initialSort?: { key: string; dir: "asc" | "desc" }; pageSize?: number }) => {
  queryParams: { first: number; offset: number; sortBy?: {key;desc}; filterBy: Record<string, ...> };
  pagination: { pageIndex, pageSize };
  setPage(i): void; setPageSize(n): void;
  sort: { key; dir } | undefined; setSort(key): void;      // toggles dir
  getFilter(key): string | undefined; setFilter(key, value?): void;  // undefined clears
}
```
URL params: `page` (1-indexed), `pageSize`, `sort`, `dir`, plus one param per filter key (e.g. `status`,
`createdDatetime`). `offset = (page-1)*pageSize`. Changing a filter resets page to 1.

## 5. `DataTable` upgrade (controlled, feature-complete)

Edit `src/components/table/DataTable.tsx`. It must accept a fully-controlled TanStack table instance and
render according to its state. Add support (keep the existing virtualized desktop body + mobile cards):
- **Row selection**: a leading select column with a **header checkbox** wired to
  `table.getIsAllPageRowsSelected()` / `getIsSomePageRowsSelected()` / `toggleAllPageRowsSelected()`, and
  per-row `row.getIsSelected()` / `row.getToggleSelectedHandler()`. Selected rows get a highlight
  (`bg-brand-light/40` or similar matching the screenshot). (The select column def lives in `columns.tsx`;
  DataTable just renders whatever columns exist — but the header/row checkbox cells must call the
  selection API. Provide a shared `selectionColumn<T>()` helper in `components/table/` that other tables
  reuse.)
- **Column visibility / order / pinning / sizing**: render header + cells honoring
  `table.getVisibleLeafColumns()` and `header.getSize()`/`column.getSize()` (already), and column order
  (TanStack `columnOrder` state reorders `getVisibleLeafColumns`). Pinning: apply `position: sticky` +
  left/right offset for pinned columns (`column.getIsPinned()`, `column.getStart('left')`). Keep it simple
  but correct.
- **Density**: accept a `density: "compact" | "comfortable" | "spacious"` prop → row height + cell padding
  (e.g. 32 / 44 / 56 px). Feed row height to the virtualizer.
- **Sorting**: header cells toggle sort via `header.column.getToggleSortingHandler()` and show an
  asc/desc indicator; the table is created with `manualSorting: true` (server sorts).
- The table is created in `ListView` (or a small `useStocktakeTable` helper) with:
  `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`, `enableRowSelection: true`,
  `getRowId: r => r.id`, and `state`/`onChange` wired to signals for `rowSelection`, `sorting`,
  `columnVisibility`, `columnOrder`, `columnPinning`, `columnSizing` (all held as signals so Wave-2 menus
  can drive them). `rowCount`/`pageCount` come from the server `totalCount`.

Keep `DataTable` generic (`<TData>`); do not hardcode stocktake types.

## 6. Shared UI primitives (`src/components/ui/`)

- `Modal.tsx` — Kobalte `Dialog`: props `{ open, onOpenChange, title, children, footer?, width?, height? }`.
  Styled to match the app (white panel, rounded, border-line, overlay `bg-black/30`). Used by create modal,
  line-edit modal, confirmations.
- `Menu.tsx` — Kobalte `DropdownMenu` (or `Popover` for rich content): a trigger + panel. Used by columns
  menu + settings menu.
- `ConfirmModal.tsx` — `{ open, title, message, confirmLabel?, tone?: "danger", onConfirm, onCancel }` built
  on `Modal`. Plus a tiny `useConfirm()` helper if convenient. Used for delete/finalise/etc.

## 7. `SelectionFooter` (`src/components/table/SelectionFooter.tsx`)

Generic footer shown when rows are selected (matches screenshot 3: "N Selected", action buttons on the
left, "Clear selection" on the right). Reference: `.../common/src/ui/components/footer/ActionsFooter.tsx`.
```ts
type FooterAction = { label: string; icon?: JSX.Element; onClick: () => void; disabled?: boolean; tone?: "danger" };
SelectionFooter(props: { count: number; actions: FooterAction[]; onClear: () => void })
```
Render nothing when `count === 0`. Style a bar (border-top, white bg) pinned at the bottom of the content
area. (It renders inline at the bottom of ListView content; not a portal.)

## 8. Wire `ListView` + leave slots

Update `src/routes/inventory/stocktakes/ListView.tsx` to:
- Use `useUrlQueryParams(...)` and `useStocktakes(queryParams)` (server-side). Remove client-side
  `getFilteredRowModel`/`getPaginationRowModel`; create the table with the manual flags + selection +
  state signals from §5. `TablePagination` becomes server-driven (see below).
- Add the **selection column** (via `selectionColumn()` helper) as the first column in `columns.tsx`.
- Leave clearly-labelled slots (comments) for Wave-2 units to fill, so they don't collide:
  ```tsx
  {/* SLOT:actions-new — 06 create modal trigger goes here (currently the dummy New stocktake button) */}
  {/* SLOT:toolbar-columns — 03 ColumnPickerMenu wraps the 1st TableToolbar button */}
  {/* SLOT:toolbar-fullscreen — 04 fullscreen toggle on the 2nd TableToolbar button */}
  {/* SLOT:toolbar-settings — 05 TableSettingsMenu wraps the 3rd TableToolbar button */}
  {/* SLOT:selection-footer — 02 renders <SelectionFooter> with Delete + Clear here */}
  ```
- `TableToolbar` (the 3 buttons) should accept `onColumns`, `onFullscreen`, `onSettings` handlers (or expose
  refs/render props) so units 03/04/05 can attach behaviour without rewriting it. Update `TableToolbar.tsx`
  accordingly (buttons become interactive; keep icons/styling).

Update `src/components/table/TablePagination.tsx` for **server pagination**: page count from
`Math.ceil(totalCount / pageSize)`, and page/size changes call the `useUrlQueryParams` setters (pass
`total`, `pageIndex`, `pageSize`, and `onPage`/`onPageSize` as props rather than reading table state).

## Acceptance

- `pnpm typecheck` + `pnpm build` pass; `pnpm dev` lists real stocktakes from the server (no mock).
- Changing page/size hits the server (network shows new `stocktakes` query with `page`); sorting a column
  re-queries with `sort`; there's a working row-selection state (header checkbox selects the page) even if
  the footer/menus are still stubs.
- `Modal`, `Menu`, `ConfirmModal`, `SelectionFooter`, `useUrlQueryParams`, and the labelled ListView slots
  all exist for Wave-2. Mock is gone.

## Parallel-safety

You own all shared infra; **land this before any Wave-2 unit starts.** Keep the ListView slots and the
`TableToolbar` handler props stable — Wave-2 specs assume these exact names.
