# 03 — Columns menu (show/hide/reorder/pin) — Wave 2 (needs 00)

The **first** of the three buttons above the table (`TableToolbar`) opens a columns menu (screenshot 1):
per-column visibility toggle, drag-reorder handle, pin-left/pin-right toggles, a "Select" (selection column)
toggle, and the bulk actions **HIDE ALL / RESET ORDER / UNPIN ALL / SHOW ALL**.

Reference (behaviour only — open-mSupply uses Material-React-Table's built-in column menu; we build ours on
the TanStack table instance):
- Table state hooks: `/Users/aneesh/Projects/open-msupply/client/packages/common/src/ui/layout/tables/tableState/{useColumnVisibility,useColumnOrder,useColumnPinning}.ts`
- Screenshot 1 is the visual/behaviour target.

## Build

`src/components/table/ColumnPickerMenu.tsx` — a `Menu`/`Popover` (from `00`) taking the TanStack `table`:
- Header row with bulk actions:
  - **HIDE ALL** → `table.getAllLeafColumns().forEach(c => c.getCanHide() && c.toggleVisibility(false))` (keep selection col visible).
  - **SHOW ALL** → `table.toggleAllColumnsVisible(true)`.
  - **RESET ORDER** → `table.resetColumnOrder()`.
  - **UNPIN ALL** → `table.resetColumnPinning()`.
- One row per column (iterate `table.getAllLeafColumns()`; use `columnOrder` for order):
  - drag handle (reorder → update the `columnOrder` signal; simplest: up/down buttons or a drag lib-free
    HTML5 DnD; up/down is acceptable and matches "reorder" behaviour),
  - pin-left / pin-right toggles → `column.pin("left" | "right" | false)` (highlight active),
  - visibility toggle (styled like the screenshot's pill switch) → `column.toggleVisibility()`,
  - the column label (`column.columnDef.header` when string, else the column id).
  - The selection column shows as the "Select" toggle at top.
- Wire in `ListView.tsx` at `{/* SLOT:toolbar-columns */}`: pass the `table` to `ColumnPickerMenu` and use
  it as the `onColumns`/trigger for the 1st `TableToolbar` button (the button becomes the menu trigger).

Requires `00` to have created the table with `columnVisibility`, `columnOrder`, `columnPinning` state
signals and `DataTable` rendering that honours them (visibility/order/pinning). If pinning render isn't
done in `00`, implement the sticky offset here in `DataTable` (coordinate) — but prefer `00` owning it.

## Acceptance

Clicking the 1st toolbar button opens the menu; toggling a column hides/shows it in the table; pin
left/right sticks the column; reorder changes column order; HIDE ALL/SHOW ALL/RESET ORDER/UNPIN ALL work.
`pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `ColumnPickerMenu.tsx`; edits only the `SLOT:toolbar-columns` region of `ListView.tsx`.
