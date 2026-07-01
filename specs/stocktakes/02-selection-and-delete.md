# 02 — Selection actions: Delete + Clear footer — Wave 2 (needs 00)

Header select-all + row checkboxes already work from `00` (DataTable selection + `selectionColumn`). This
unit adds the **below-table footer** (screenshot 3): "N Selected", a **Delete** action, and **Clear
selection** — wired to a real delete mutation.

Reference (behaviour only):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/ListView/Footer.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/document/useStocktakeDelete.ts` (+ `.../api/hooks/useStocktakeList.ts` delete path)
- Delete mutation doc: `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/operations.graphql` (`deleteStocktakes` via `batchStocktake`)
- Deletable rule: a stocktake is deletable only when `status === NEW` and `isLocked === false`
  (`canDeleteStocktake` in `.../Stocktake/utils`).

## Build

1. **Delete mutation** — `src/routes/inventory/stocktakes/api/useStocktakeDelete.ts`:
   - Add to `api/operations.ts`:
     ```graphql
     mutation deleteStocktakes($storeId: String!, $ids: [DeleteStocktakeInput!]) {
       batchStocktake(storeId: $storeId, input: { deleteStocktakes: $ids }) {
         ... on BatchStocktakeResponse { deleteStocktakes { id } }
       }
     }
     ```
     (`DeleteStocktakeInput = { id: String! }`.)
   - Add `deleteStocktakes(rows)` to `api.ts` (maps rows → `{ id }[]`). Hook `useStocktakeDelete()` =
     `useMutation` that on success invalidates `api.keys.base()`.

2. **Footer wiring** in `ListView.tsx` at `{/* SLOT:selection-footer */}`:
   - `const selected = () => table.getSelectedRowModel().rows.map(r => r.original);`
   - Render `<SelectionFooter count={selected().length} onClear={() => table.resetRowSelection()} actions={[{ label: "Delete", tone: "danger", icon: <DeleteIcon/>, onClick: confirmDelete }]} />`.
   - `confirmDelete` opens `ConfirmModal` ("Are you sure? Delete N stocktakes"). On confirm:
     `await del.mutateAsync(selected()); table.resetRowSelection();`.
   - **Deletable guard**: if any selected row is not deletable (`status !== NEW || isLocked`), disable the
     Delete action and show a tooltip/message ("Cannot delete finalised or on-hold stocktakes"). Mirror
     open-mSupply's `canDeleteStocktake` (only NEW & unlocked deletable).
   - Add a `DeleteIcon` to `src/components/icons.tsx` if missing (trash outline).

## Acceptance

Selecting rows (header select-all or per-row) shows the footer with the count; Delete confirms then
deletes via `batchStocktake` and clears selection + refetches; Clear deselects all; Delete is disabled when
any selected row is finalised/on-hold. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `useStocktakeDelete.ts` + the `deleteStocktakes` doc; edits only the `SLOT:selection-footer` region of
`ListView.tsx`. Coordinate ListView merge order with 03/04/05/06 (all edit different labelled slots).
