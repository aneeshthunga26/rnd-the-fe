# 08 — Detail lines table (columns, grouping, placeholders) — Wave 3 (needs 07)

Render the stocktake **lines** in the DetailView using the shared `DataTable`, with the full column set,
item search filtering, row selection (for footer actions in 10), and row-click to open the line-edit modal
(09). Group by item; mark uncounted rows as placeholders.

Reference (behaviour + exact columns):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/columns.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/DetailView.tsx` (grouping, placeholder logic, table setup)

## Build

`src/routes/inventory/stocktakes/DetailView/lineColumns.tsx` — `ColumnDef<StocktakeLineFragment>[]` (via a
`useLineColumns()` that reads `usePreferences()` from 01 for gated columns). Columns (port the full list):
- `item.code` (Code, pinned left, groups rows), `itemName` (Name), `batch`, `expiryDate` (date),
  `manufactureDate` (date), `location.code` (Location), `item.unitName` (Unit), `packSize`,
  `item.doses` (Doses per unit — gated by `manageVaccinesInDoses && item.isVaccine`),
  `snapshotNumberOfPacks` (Snapshot, sum), `countedNumberOfPacks` (Counted, sum),
  `dosesCounted` = `counted * packSize * item.doses` (gated, sum), `difference` = `(counted ?? snapshot) -
  snapshot` (sum), `reasonOption.reason` (Reason), `donorName` (gated by `allowTrackingOfStockByDonor`),
  `manufacturer.name`, `comment`.
- **Error highlighting**: cells for `snapshotNumberOfPacks` / `countedNumberOfPacks` show a red border when
  the line has a matching error in the line-error context (07): `SnapshotCountCurrentCountMismatchLine` /
  `StockLineReducedBelowZero`.

Wiring in `07`'s DetailView at `{/* SLOT:lines-table */}`:
- `useStocktakeLines(id, { filterBy: itemFilter() ? { itemCodeOrName: { like: itemFilter() } } : undefined,
  sortBy: { key: "itemName", desc: false } })` (server-side; check schema `StocktakeLineFilterInput` for the
  item-name filter field name).
- Create a TanStack table (reuse `00`'s selection + DataTable) with `enableRowSelection` (unless disabled),
  `getRowId: r => r.id`, grouping by `item.code` if you implement grouping (optional first pass: flat list,
  sorted by item name — grouping can be a follow-up; note it). Placeholder styling: rows with
  `countedNumberOfPacks == null` render muted (matches "uncounted").
- **Row click** opens the line-edit modal (09) for that line's item — call an `openLineEdit(item)` handler
  that 09 provides (define the handler contract with 09: `(item, mode) => void`).
- Selected rows feed `10`'s footer (expose `table` / selected rows to the footer slot).

Reuse `DataTable`, `TablePagination`, and the density/columns/selection infra from `00`. Do not fork the table.

## Acceptance

DetailView shows the lines with all (preference-appropriate) columns; item search filters server-side;
snapshot/counted/difference compute and aggregate; error cells highlight from the line-error context;
selecting rows works; clicking a row opens the line-edit modal. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `lineColumns.tsx` + the lines-table region of DetailView. Coordinates two small contracts with 09
(`openLineEdit`) and 10 (selected rows / table access). Depends on 07 + 01 (preferences).
