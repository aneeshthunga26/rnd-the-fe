# 06 — Create Stocktake modal — Wave 3 (needs 00 + 01)

Port the "New stocktake" modal: three creation types (FULL / FILTERED / BLANK), filter inputs, an estimated
line-count, and the `insertStocktake` mutation that navigates to the new stocktake on success.

Reference (behaviour + exact fields):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/ListView/CreateStocktakeModal.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/ListView/StocktakeFilters.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/ListView/FullStocktakeOnHandSelector.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/ListView/useGenerateComment.ts`, `.../types.ts`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/useStocktake.ts` (+ `api.ts` insert)
- Schema `InsertStocktakeInput` in `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## Behaviour (from reference)

Types (`StocktakeType`): **FULL** | **FILTERED** | **BLANK**. Radio switch resets all other state on change.
- **FULL**: one "Include all items" choice — false = only items with stock on hand; true = also include
  out-of-stock master-list/stock items.
- **FILTERED**: inputs — Master List, Location, "Items expiring before" (date), VVM status
  (gated by `manageVvmStatusForStock`). Setting Location/Expiry/VVM clears/disables "include all items";
  "include all items" only enabled when a Master List is set and no other filter is active.
- **BLANK**: no inputs; shows a "will create a blank stocktake" note.
- **Estimated lines** (shown for FULL/FILTERED): count of stock lines matching the filters, plus (when
  "include all items") the count of matching items with no stock. Uses `stockLinesCount` + `items`
  (`hasStockOnHand: false, type: STOCK`) counts — see reference `useStockListCount` / `useItemsByFilter`.
  This is display-only; a rough server count query is acceptable.

## Build

1. Search inputs from **01**: `MasterListSearchInput`, `LocationSearchInput`, `VVMStatusSearchInput`,
   date input (reuse a simple `<input type="date">` or an existing date component), `usePreferences()` for
   the VVM gate. Do not rebuild them.
2. `src/routes/inventory/stocktakes/api/useCreateStocktake.ts` + add to `api/operations.ts`:
   ```graphql
   mutation insertStocktake($storeId: String!, $input: InsertStocktakeInput!) {
     insertStocktake(storeId: $storeId, input: $input) { ... on StocktakeNode { id stocktakeNumber } }
   }
   ```
   `InsertStocktakeInput` fields (set per type): `id` (uuid via `crypto.randomUUID()`), `isAllItemsStocktake`
   (FULL), `masterListId`/`includeAllMasterListItems`/`locationId`/`vvmStatusId`/`expiresBefore` (FILTERED;
   `expiresBefore` is `NaiveDate` `YYYY-MM-DD`, and the reference subtracts 1 day before sending),
   `createBlankStocktake` (BLANK), `comment`, `description`. Hook = `useMutation` → on success invalidate
   `api.keys.base()` and return the new id.
3. `src/routes/inventory/stocktakes/CreateStocktakeModal.tsx` — built on `00`'s `Modal`. Radio type
   selector + conditional fields + estimated-lines note + OK/Cancel. Port `useGenerateComment` (FILTERED
   builds a comment from active filters; FULL/BLANK → empty). On OK: build the input for the type, call the
   mutation, then `navigate(ROUTES detail path for id)` (detail route comes from 07; until 07 lands,
   navigate to `/inventory/stocktakes/<id>` and note the dependency).
4. Wire in `ListView.tsx` at `{/* SLOT:actions-new */}`: the existing "New stocktake" button (desktop
   AppBar action via `PageActions`, and the mobile filter-row icon) opens this modal (a signal `open`).

## Acceptance

New-stocktake button opens the modal; each type builds the correct `InsertStocktakeInput`; estimate updates
with filters; OK creates the stocktake and navigates to its detail page; the list refetches. VVM field
hidden unless `manageVvmStatusForStock`. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `CreateStocktakeModal.tsx` + `useCreateStocktake.ts` (+ insert doc); edits only `SLOT:actions-new` in
`ListView.tsx`. Depends on 01 (search inputs) and, for post-create navigation, 07 (detail route).
