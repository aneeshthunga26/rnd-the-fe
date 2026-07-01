# 10 — Detail footer: status/lock/finalise + selected-line actions — Wave 3 (needs 07)

Port the DetailView footer. Two modes:
- **No lines selected**: lock/hold toggle, status crumbs (Created → Finalised with timestamps), and a
  **Save & confirm status → Finalised** button.
- **Lines selected**: an actions footer with **Delete lines**, **Change location**, **Reduce to zero**.
Plus the finalise/line error modal.

Reference (behaviour + mutations):
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/Footer/{Footer,StatusChangeButton,StocktakeLockButton}.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/DetailView/{ReduceLinesToZeroModal,ChangeLocationModal,StocktakeErrorModal}.tsx`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/line/{useZeroStocktakeLines,useChangeLinesLocation,useStocktakeDeleteLines,useStocktakeDeleteSelectedLines}.ts`
- `/Users/aneesh/Projects/open-msupply/client/packages/inventory/src/Stocktake/api/hooks/document/useUpdateStocktake.ts`
- Error unions (`UpdateStocktakeError`: `StocktakeIsLocked`, `SnapshotCountCurrentCountMismatch`,
  `StockLinesReducedBelowZero`, `CannotEditStocktake`) in `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## Build

1. **Mutations / hooks** (reuse `useSaveStocktakeLines` from 09 for line ops; add if 09 not merged yet,
   coordinate to avoid dup docs):
   - `useStocktakeDeleteLines()` — `batchStocktake` `deleteStocktakeLines`; invalidate `keys.detail(id)`.
   - `useZeroStocktakeLines()` — maps selected → `{ ...line, countedNumberOfPacks: 0, countThisLine: true,
     reasonOption }` and saves via `useSaveStocktakeLines`. Exposes `allSelectedItemsAreVaccines`.
   - `useChangeLinesLocation()` — maps selected → `{ ...line, location, isUpdated: true, countThisLine: true }`
     and saves.
   - Finalise + lock reuse `useUpdateStocktake()` from 07 (`{ id, status: FINALISED }` / `{ id, isLocked }`).

2. **Footer** at `07`'s `{/* SLOT:detail-footer */}` — render mode by selected-row count (from 08's table):
   - **StocktakeLockButton**: toggles `isLocked` via `updateStocktake` (confirm modal); only enabled when
     `status === NEW`; hidden when finalised & not locked.
   - **StatusChangeButton** ("Save and confirm status: Finalised"): confirm → `updateStocktake({ id,
     status: FINALISED })`. Guard: disabled when disabled/no lines/all lines uncounted (toast otherwise).
     On error union, push messages into the line-error context (07) + open the error modal.
   - **Selected-line actions** (reuse `00`'s `SelectionFooter` shape): Delete lines (confirm →
     `useStocktakeDeleteLines`), Change location (opens `ChangeLocationModal`), Reduce to zero (opens
     `ReduceLinesToZeroModal`); clear selection resets the table selection.
3. **ChangeLocationModal** (on `00` Modal): a `LocationSearchInput` (from 01); if selected rows have
   conflicting `restrictedLocationTypeId`s, disable + warn; compute total volume required; on confirm →
   `useChangeLinesLocation(location)`.
4. **ReduceLinesToZeroModal** (on `00` Modal): if any selected item is a vaccine (or it's a reduction),
   require a reason (`ReasonOptionsSearchInput` from 01, type via `getReasonOptionTypes({ isInventoryReduction:
   true, isVaccine, isDispensary })`); on confirm → `useZeroStocktakeLines().onZeroQuantities(reason)`.
5. **StocktakeErrorModal** (on `00` Modal): reads the line-error context (07) — lists stocktake-level error
   messages + per-line errors (item code/name/batch) with the message keys from the line-error context.
   Opened by the finalise flow (and any line save that fails).

## Acceptance

With no selection: lock toggles hold; finalise validates (blocks when no counted lines) and either finalises
(status → Finalised, list/detail refetch) or opens the error modal with structured errors. With selection:
delete lines, change location (respecting restricted types), and reduce-to-zero (with reason when required)
all mutate via `batchStocktake` and refetch. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `DetailView/Footer/*` + the confirmation/error modals + line-op hooks. Consumes 07 (context, update,
disabled helper), 08 (selected rows / table), 01 (location/reason inputs). Coordinate `useSaveStocktakeLines`
ownership with 09 (one of you creates it; the other imports).
