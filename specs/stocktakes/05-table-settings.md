# 05 — Table settings menu — Wave 2 (needs 00)

The **third** (gear) toolbar button opens the settings menu (screenshot 2):
**Reset column order · Show all columns · Reset column sizes · Reset pinned columns · Toggle density ·
Reset table to defaults**. Plus **persistence** of table state (density, visibility, order, pinning, sizing)
to `localStorage` so resets are meaningful across reloads.

Reference (behaviour only):
- `/Users/aneesh/Projects/open-msupply/client/packages/common/src/ui/layout/tables/components/SettingsMenu.tsx`
- Persistence + state hooks: `/Users/aneesh/Projects/open-msupply/client/packages/common/src/ui/layout/tables/tableState/*` (localStorage key `@openmsupply-client/tables/{tableId}`)

## Build

1. `src/lib/persistTableState.ts` — a helper that binds the table-state signals from `00`
   (`columnVisibility`, `columnOrder`, `columnPinning`, `columnSizing`, `density`) to `localStorage` under a
   `tableId` key (e.g. `rnd-the-fe/tables/stocktake-list`). Provide:
   `usePersistedTableState(tableId, signals)` — hydrates signals from storage on mount, persists on change
   (debounce sizing ~500ms), and returns `{ reset: () => void, resetOrder, resetSizes, resetPinned, showAll, resetVisibility }`.
   Resets clear the relevant slice from storage and call the table's `resetX()` methods.

2. `src/components/table/TableSettingsMenu.tsx` — a `Menu` (from `00`) with items:
   - **Reset column order** → `table.resetColumnOrder()` + clear stored order (disabled if none stored).
   - **Show all columns** → `table.toggleAllColumnsVisible(true)` + clear stored visibility.
   - **Reset column sizes** → `table.resetColumnSizing()` + clear stored sizing.
   - **Reset pinned columns** → `table.resetColumnPinning()` + clear stored pinning.
   - **Toggle density** → cycle `compact → comfortable → spacious` (drives the `density` signal `00` feeds
     to `DataTable`). Show the current density.
   - divider, then **Reset table to defaults** (danger/reset styling) → clear the whole `tableId` key + reset
     all table state.
   (Skip the admin "save as global default" — out of scope; note it as future.)

3. Wire in `ListView.tsx` at `{/* SLOT:toolbar-settings */}`: `TableSettingsMenu` as the 3rd `TableToolbar`
   button's menu; call `usePersistedTableState("stocktake-list", signals)` where the table is created and
   pass its resets to the menu. (The state signals live in `00`'s table setup; import/lift as needed —
   coordinate with `00` so the signals are exported/accessible.)

## Acceptance

Gear button opens the menu; density toggle changes row height/padding live; each reset clears its slice and
reverts; reloading the page preserves density/visibility/order/pinning/sizing; "Reset table to defaults"
clears everything. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `TableSettingsMenu.tsx` + `persistTableState.ts`; edits only the `SLOT:toolbar-settings` region of
`ListView.tsx`. Depends on `00` exposing the table-state signals.
