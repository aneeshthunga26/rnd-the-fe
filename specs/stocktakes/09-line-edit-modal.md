# 09 — Line-edit modal (Batch / Pricing / Other tabs) — Wave 3 (needs 07 + 01)

Port the stocktake line-edit modal: opened from a lines-table row (08) or "add item", it edits all batches
of one item across three tabbed editable tables and saves via `batchStocktake` (insert/update/delete lines).

Reference (behaviour + exact fields + mutations):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/modal/StocktakeLineEdit/*` (StocktakeLineEdit, StocktakeLineEditModal, StocktakeLineEditForm, StocktakeLineEditTables, StocktakeLineEditTabs, StocktakeLineEditErrorBanner, utils.ts, hooks/{useDraftStocktakeLines,useStocktakeLineEdit,useNextItem})
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/line/useStocktakeSaveLines.ts`
- Schema: `InsertStocktakeLineInput`, `UpdateStocktakeLineInput`, `DeleteStocktakeLineInput`, `batchStocktake`, and the line error unions in `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## Model

- **DraftStocktakeLine** = `StocktakeLineFragment` (minus `__typename`) + `{ countThisLine: boolean;
  isCreated?: boolean; isUpdated?: boolean }`. Port the `DraftLine.fromItem / fromStockLine /
  fromStocktakeLine` constructors from `utils.ts`.
- A controller (`useStocktakeLineEdit(item, mode)`) that: loads existing stocktake lines for the item +
  the item's stock lines, builds draft rows (existing counted lines + uncounted stock lines), exposes
  `draftLines`, `update(patch)`, `addLine(patch?)`, `save()`, `isSaving`, and `nextItem` (via `useNextItem`).
  Use Solid **stores** (`createStore`) for the draft-lines array (nested reactive edits).

## Build

1. `src/routes/inventory/stocktakes/api/useSaveStocktakeLines.ts` + docs in `api/operations.ts`:
   ```graphql
   mutation upsertStocktakeLines($storeId: String!, $insert: [InsertStocktakeLineInput!], $update: [UpdateStocktakeLineInput!], $delete: [DeleteStocktakeLineInput!]) {
     batchStocktake(storeId: $storeId, input: { insertStocktakeLines: $insert, updateStocktakeLines: $update, deleteStocktakeLines: $delete }) {
       ... on BatchStocktakeResponse {
         insertStocktakeLines { id response { ...on StocktakeLineNode { id } ...on InsertStocktakeLineError { error { __typename description } } } }
         updateStocktakeLines { id response { ...on StocktakeLineNode { id } ...on UpdateStocktakeLineError { error { __typename description } } } }
         deleteStocktakeLines { id response { __typename } }
       }
     }
   }
   ```
   Partition drafts → insert (`isCreated && countThisLine`), update (`isUpdated && countThisLine`), delete
   (existing line with `countThisLine === false`). Port the input transforms (`toInsert/toUpdate/toDelete`)
   from `utils.ts` incl. `NaiveDate`/nullable-update wrappers (`{ value }` for nullable date/string fields).
   Hook = `useMutation` → invalidate `keys.detail(id)`; return `saveAndMapStructuredErrors(drafts)` that maps
   the per-line error `__typename`s into the line-error context (07) and returns `{ errorMessages }`.
2. Line error mapping keys (into 07's context): `StockLineReducedBelowZero`, `SnapshotCountCurrentCountMismatchLine`,
   `AdjustmentReasonNotProvided`, `AdjustmentReasonNotValid`, plus common `CannotEditStocktake`.
3. `DetailView/modal/StocktakeLineEdit.tsx` on `00`'s `Modal` (large: ~1260×650). Header: `StockItemSearchInput`
   (from 01; disabled in Update mode; excludes items already in the stocktake) + unit-name display. Tabs
   (from `StocktakeLineEditTabs`): **Batch**, **Pricing**, **Other** — each an editable table over `draftLines`:
   - **Batch**: `count this line` checkbox, batch, expiry date, manufacture date, VVM status (gated + only if
     no linked stock line), pack size (required; disabled if linked to a stock line; default `item.defaultPackSize`),
     snapshot packs (read-only), counted packs, doses counted (gated, computed read-only), volume per pack,
     **reason** (`ReasonOptionsSearchInput` from 01; required when `counted != snapshot`; type via
     `getReasonOptionTypes({ isInventoryReduction: snapshot > (counted ?? 0), isVaccine, isDispensary })`).
     Port the pack-size-change and counted-change patch helpers (clear default sell price / clear reason when
     direction changes).
   - **Pricing**: count-this-line, batch, sell price, cost price (currency inputs).
   - **Other**: count-this-line, batch, location (`LocationSearchInput`, respects `restrictedLocationTypeId`),
     donor (`DonorSearchInput`, gated), campaign/program, manufacturer (`ManufacturerSearchInput`; clears
     `itemVariantId` on change), comment.
   - **Add batch** button (adds a blank draft line; if the item has variants, first pick a variant — port the
     variant panel or, for a first pass, add a blank line and note the variant-picker as a follow-up).
   - Footer buttons: **Cancel** (discard), **OK** (save + close), **Next** (Update mode: save + advance to
     `nextItem`; disabled at end / when invalid). Show `StocktakeLineEditErrorBanner` from the line-error context.
4. Wire into `07`'s DetailView at `{/* SLOT:line-edit-modal */}`: provide the `openLineEdit(item, mode)`
   handler that 08's row-click calls; also used by an "add item" affordance.

## Acceptance

Row click opens the modal for that item showing all its batches; edits across the three tabs mutate the
draft store; count-this-line toggles include/exclude (delete on save); reason required when counted differs;
OK saves via `batchStocktake` (insert/update/delete) and the lines table refetches; structured errors surface
per-line + in the banner; Next advances through items. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `DetailView/modal/*` + `useSaveStocktakeLines.ts` + line docs. Consumes 01 (search inputs, reasons,
prefs) and 07 (line-error context, `updateStocktake` not needed here). Contract with 08: the `openLineEdit`
handler signature.
