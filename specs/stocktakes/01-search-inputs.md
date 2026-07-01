# 01 — Search inputs (async comboboxes) — Wave 2 (needs 00)

The create modal (06) and line-edit modal (09/10) need typed, server-backed search/select inputs. Build a
generic async combobox + one thin input per entity. Each is a small gql.tada query + `@tanstack/solid-query`
+ the combobox. **Owns only new files** — no collisions with other units.

Reference (behaviour + which query each runs; do not copy React/MUI):
- `/Users/aneesh/Projects/open-msupply/client/packages/system/src/MasterList/Components/MasterListSearchInput.tsx` + `.../MasterList/api/hooks/useMasterLists.ts`
- `/Users/aneesh/Projects/open-msupply/client/packages/system/src/Location/Components/LocationSearchInput.tsx` + `.../Location/api/hooks/useLocationList.ts`
- `/Users/aneesh/Projects/open-msupply/client/packages/system/src/Stock/Components/VVMStatusSearchInput/VVMStatusSearchInput.tsx` + `.../Stock/api/hooks/useVvmStatusesEnabled.ts`
- Reason options: search `system/src/.../ReasonOptions*` (query `reasonOptions`)
- Item search: `system/src/Item/.../StockItemSearchInput` (query `items` with `ItemStockOnHandFragment`)
- Donor/Manufacturer: `system/src/Name/...` (query `names`, filter `isDonor` / `isManufacturer`)
- Schema for all inputs/filters/nodes: `/Users/aneesh/Projects/open-msupply/server/schema.graphql`

## Build

1. `src/components/inputs/AsyncCombobox.tsx` — generic Kobalte `Combobox` (or `Select` for static lists):
   props `{ value, onChange, options | loadOptions, getLabel, getValue, placeholder, clearable, disabled, width }`.
   Debounced text → `loadOptions(search)`; renders label; supports clear. Styled to match app inputs
   (border-line, rounded-lg, text-sm). Reusable across entities.

2. A `search/` (or per-entity `api/`) module with gql.tada docs + a hook per entity. Recommended location:
   `src/components/inputs/search/<Entity>SearchInput.tsx` each exporting a typed component, plus
   `src/components/inputs/search/operations.ts` for the shared docs. Entities + queries (all take `storeId`):

   | Component | Query | Key node fields | Filter/args |
   |---|---|---|---|
   | `MasterListSearchInput` | `masterLists(storeId, filter)` | id, name, code, description, linesCount | `existsForStoreId: { equalTo: storeId }` |
   | `LocationSearchInput` | `locations(storeId, filter, sort)` | id, name, code, onHold, `locationType { id name }` | optional `restrictedToLocationTypeId`; sort name asc |
   | `VVMStatusSearchInput` | `activeVvmStatuses(storeId)` | id, description, priority, unusable, reasonId | preference-gated (see below) |
   | `ReasonOptionsSearchInput` | `reasonOptions(filter)` | id, reason, type, isActive | filter by `type` (see below) + `isActive: true` |
   | `StockItemSearchInput` | `items(storeId, filter)` → `ItemStockOnHandFragment` | id, code, name, unitName, isVaccine, doses, defaultPackSize, restrictedLocationTypeId, `itemStoreProperties { defaultSellPricePerPack }` | `isVisibleOrOnHand: true`, exclude ids: `id: { notEqualAll: [...] }` |
   | `DonorSearchInput` | `names(storeId, filter)` | id, name, code | `isDonor: true` |
   | `ManufacturerSearchInput` | `names(storeId, filter)` | id, name, code | `isManufacturer: true` |
   | `CampaignOrProgramSelect` | `campaigns` + `programs` | id, name | see line-edit spec (09) |

   Put the gql.tada docs in `operations.ts`; each hook = `useQuery` via a small `useSearchApi()` hub
   reusing `STORE_ID` (mirror the stocktakes `api/` pattern, or inline — these are read-only lists).

3. **ReasonOptions type filtering** — the reason input filters options by adjustment type. Port the helper
   `getReasonOptionTypes({ isInventoryReduction, isVaccine, isDispensary })` from
   `/Users/aneesh/Projects/open-msupply/client/packages/system/src/.../ReasonOptions` (find it; it maps to
   `ReasonOptionNodeType` values e.g. `PositiveInventoryAdjustment | NegativeInventoryAdjustment` and vaccine
   variants). Export it for 09/10 to reuse.

4. **Preferences** — VVM/donor inputs are preference-gated (`manageVvmStatusForStock`,
   `allowTrackingOfStockByDonor`). Add a tiny `usePreferences()` hook (gql.tada `preferences(storeId)` query
   → the boolean prefs the stocktake screens need). Reference:
   `/Users/aneesh/Projects/open-msupply/client/packages/common/src/authentication/api/hooks/usePreferences.ts`.
   Export it; 06/08/09 consume it to gate fields.

## Acceptance

Each input renders, searches the server, emits the selected node (or null on clear), and is typed via
gql.tada. `usePreferences()` and `getReasonOptionTypes()` are exported. `pnpm typecheck`/`build` pass.

## Parallel-safety

Creates only new files under `src/components/inputs/`. No edits to ListView/DataTable/detail. Safe with all
other Wave-2 units.
