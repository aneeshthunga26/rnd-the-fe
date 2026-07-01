# 07 — Detail view scaffold (route, data, side panel, toolbar) — Wave 2 (needs 00)

Foundation for the detail track. Adds the `/inventory/stocktakes/:id` route + screen, the stocktake detail
data layer (fetch + update), the editable **side panel** and **toolbar**, and **labelled slots** for the
lines table (08), line-edit modal (09), and footer (10).

Reference (behaviour + fields):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/DetailView.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/SidePanel.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/Toolbar.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/document/{useStocktake,useUpdateStocktake}.ts`, `.../line/useStocktakeLines.ts`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/context/stocktakeLineError.tsx`
- Schema: `StocktakeNode`, `StocktakeLineNode`, `UpdateStocktakeInput` in `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## Build

1. **Route**: add `stocktakeDetail: "/inventory/stocktakes/:id"` to `src/routes/routes.ts` (`ROUTES`), a
   screen `src/routes/inventory/stocktakes/DetailView/DetailView.tsx` (default-exported route entry that
   reads `useParams().id`), register it in `src/routes/registry.tsx`, and add a title entry to
   `src/routes/routeMeta.ts` (title from the stocktake number/description). Keep it under `AppLayout`.

2. **Data layer** — add to `api/operations.ts`:
   - `StocktakeFragment` on `StocktakeNode`: `id, stocktakeNumber, comment, description, createdDatetime,
     finalisedDatetime, status, isLocked, countedBy, verifiedBy, isInitialStocktake, user { username email }`
     (+ `lines { totalCount }` if convenient).
   - `stocktake($id, $storeId)` query → `... on StocktakeNode { ...StocktakeFragment }`.
   - `updateStocktake($storeId, $input: UpdateStocktakeInput!)` mutation (`UpdateStocktakeInput`:
     `{ id!, comment?, description?, status?: FINALISED, isLocked?, countedBy?, verifiedBy? }`) →
     `... on StocktakeNode { id } ... on UpdateStocktakeError { error { __typename description
       ... on SnapshotCountCurrentCountMismatch { lines { stocktakeLine { id itemName } } }
       ... on StockLinesReducedBelowZero { errors { stockLine { id itemId } } } } }`.
   - `StocktakeLineFragment` on `StocktakeLineNode` (full field set — see the exploration / reference
     `operations.generated.ts`): id, stocktakeId, itemId, itemName, batch, expiryDate, manufactureDate,
     packSize, snapshotNumberOfPacks, countedNumberOfPacks, sellPricePerPack, costPricePerPack, comment,
     volumePerPack, donorId, donorName, itemVariantId, and relations `item { id code name unitName isVaccine
     doses defaultPackSize restrictedLocationTypeId itemStoreProperties { defaultSellPricePerPack } }`,
     `location { id name code onHold locationType { id name } }`, `stockLine { id }`, `reasonOption { id
     reason type isActive }`, `vvmStatus { id description priority reasonId unusable }`, `manufacturer { id
     name code }`, `itemVariant { id packagingVariants { id packSize volumePerUnit } }`, `campaign { id name
     }`, `program { id name }`.
   - `stocktakeLines($stocktakeId, $storeId, filter?, sort?, page?)` query.
   - `keys.ts`: `detail(id)`, `lines(id, params)`. `useStocktake(id)`, `useStocktakeLines(id, params)`,
     `useUpdateStocktake()` (invalidate `keys.detail(id)` for line/field edits; `keys.base()` for status).
   - Extend `useStocktakeApi.ts` with the new query fns (`get.byId`, `get.lines`, `update`).

3. **Disabled state** helper: `isStocktakeDisabled(stocktake) = status !== NEW || isLocked` (port from
   `.../api/hooks/utils/useIsStocktakeDisabled.ts`).

4. **Line-error context** — port `context/stocktakeLineError.tsx` as a Solid context provider
   (`StocktakeLineErrorProvider` + `useStocktakeLineError()`): holds per-line errors keyed by line id,
   stocktake-level error messages, and an error-modal open signal. Wrap the DetailView screen in it. 09/10
   populate it; 08 reads it for cell error highlighting; the error modal (10) reads it.

5. **DetailView screen** layout: breadcrumb/title (stocktake number), a right **SidePanel** and main content.
   - **SidePanel** (buffered inputs, disabled when `isStocktakeDisabled`): read-only "entered by"
     (`user.username`) + "created" (formatted `createdDatetime`); editable **counted by**, **verified by**
     (text) and **comment** (textarea) → each debounced/buffered → `updateStocktake({ id, countedBy | verifiedBy | comment })`.
     Actions: **Delete** (only if deletable = NEW & !locked; confirm → `deleteStocktakes` from 02's api, then
     navigate back to the list) and **Copy to clipboard** (`navigator.clipboard.writeText(JSON.stringify(stocktake))`).
   - **Toolbar** (top of content): editable **description** (buffered → `updateStocktake({ id, description })`,
     disabled when disabled) + an info alert ("on hold" when locked / "finalised" when finalised) + an item
     **search** input that drives the lines-table filter (lift a `itemFilter` signal for 08).
   - Leave slots:
     ```tsx
     {/* SLOT:lines-table — 08 renders the lines DataTable here (uses itemFilter + row selection) */}
     {/* SLOT:line-edit-modal — 09 mounts <StocktakeLineEditModal> here, opened by a row click */}
     {/* SLOT:detail-footer — 10 renders the footer (status/lock/finalise + selected-line actions) here */}
     ```

## Acceptance

Navigating to `/inventory/stocktakes/:id` loads the stocktake; side panel shows/edits counted-by/verified-by/
comment (persisted via `updateStocktake`); description edits persist; disabled state greys inputs for
finalised/locked; delete + copy work; the line-error context provider wraps the screen; slots exist.
`pnpm typecheck`/`build` pass.

## Parallel-safety

Owns the whole `DetailView/` folder scaffold + detail api additions + routes/registry/routeMeta edits (small,
additive). Must land before 08/09/10. Keep the three DetailView slots + `itemFilter` signal + line-error
context API stable.
