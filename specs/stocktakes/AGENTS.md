# Kickoff prompts (one per unit)

Copy-paste a block below to launch an agent for that unit. Respect the waves:

- **Wave 1 (alone, merge first):** `00`
- **Wave 2 (parallel, after 00):** `01`, `02`, `03`, `04`, `05`, `07`
- **Wave 3 (parallel, after deps):** `06` (needs 01), `08` (needs 07), `09` (needs 07+01), `10` (needs 07)

Every prompt assumes CWD is `/Users/aneesh/Projects/rnd-the-fe`. Each agent must read
`specs/stocktakes/README.md` first (shared conventions, repo map, open-mSupply reference paths, file-ownership
matrix), then its unit spec. Universal rules baked into each prompt: port **functionality only** (styling is
done — match existing components, no MUI/copying); open-mSupply is a **behaviour/data reference** at absolute
paths, not code to copy; follow the `api/` data-layer + component conventions in `CLAUDE.md`; `pnpm typecheck`
and `pnpm build` must pass; **do not commit**; stay within your unit's owned files + its labelled slot.

---

## 00 — Foundation  (Wave 1)
```
Implement specs/stocktakes/00-foundation.md in /Users/aneesh/Projects/rnd-the-fe.
Read specs/stocktakes/README.md then 00-foundation.md fully before coding. This is the critical path —
everything else depends on it. Port functionality only (styling already matches; no MUI). open-mSupply
(/Users/aneesh/Projects/open-msupply/...) is a behaviour reference, not code to copy. Deliver: Kobalte added;
mock fully removed; server-side filter/sort/pagination for the stocktakes list; DataTable upgraded to a
controlled table (selection + header select-all, visibility/order/pinning/sizing, density, manual modes);
shared components/ui/{Modal,Menu,ConfirmModal}; lib/useUrlQueryParams; components/table/SelectionFooter; and
ListView left with the exact labelled SLOT comments + TableToolbar handler props from the spec. Keep those
slot/handler names stable — Wave-2 units depend on them. Run pnpm typecheck + pnpm build (both must pass) and
pnpm dev against the real server (VITE_GRAPHQL_URL). Do not commit.
```

## 01 — Search inputs  (Wave 2)
```
Implement specs/stocktakes/01-search-inputs.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 01-search-inputs.md. Build a generic AsyncCombobox + typed gql.tada
search inputs (MasterList, Location, VVMStatus, ReasonOptions, StockItem, Donor, Manufacturer,
Campaign/Program), plus usePreferences() and getReasonOptionTypes(). Reference the open-mSupply system-package
components at the absolute paths in the spec for which query each runs — reimplement with gql.tada +
@tanstack/solid-query + Kobalte (no MUI copy). Only create new files under src/components/inputs/. pnpm
typecheck + build must pass. Do not commit.
```

## 02 — Selection actions: Delete + Clear footer  (Wave 2)
```
Implement specs/stocktakes/02-selection-and-delete.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 02-selection-and-delete.md. Add the deleteStocktakes mutation +
useStocktakeDelete, and render <SelectionFooter> (Delete + Clear) at the SLOT:selection-footer in ListView.
Enforce the deletable rule (NEW & !locked). Edit ONLY that slot in ListView. pnpm typecheck + build must
pass. Do not commit.
```

## 03 — Columns menu  (Wave 2)
```
Implement specs/stocktakes/03-columns-menu.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 03-columns-menu.md. Build components/table/ColumnPickerMenu.tsx (show/
hide, reorder, pin left/right, HIDE ALL / SHOW ALL / RESET ORDER / UNPIN ALL) driven by the TanStack table
instance from 00; screenshot 1 is the behaviour target. Wire it to the 1st TableToolbar button at
SLOT:toolbar-columns only. pnpm typecheck + build must pass. Do not commit.
```

## 04 — Fullscreen  (Wave 2)
```
Implement specs/stocktakes/04-fullscreen.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 04-fullscreen.md. Build useFullscreen + FullscreenContainer; wrap only
the toolbar-buttons + DataTable + TablePagination region (filter bar excluded) so fullscreen shows just those.
Wire the 2nd TableToolbar button at SLOT:toolbar-fullscreen only. pnpm typecheck + build must pass. Do not
commit.
```

## 05 — Table settings menu  (Wave 2)
```
Implement specs/stocktakes/05-table-settings.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 05-table-settings.md. Build TableSettingsMenu (reset order/sizes/pinned,
show all, toggle density, reset to defaults — screenshot 2) + lib/persistTableState (localStorage). Wire the
3rd/gear TableToolbar button at SLOT:toolbar-settings only; use the table-state signals 00 exposes. pnpm
typecheck + build must pass. Do not commit.
```

## 06 — Create Stocktake modal  (Wave 3 — needs 01)
```
Implement specs/stocktakes/06-create-modal.md in /Users/aneesh/Projects/rnd-the-fe (00 + 01 merged).
Read specs/stocktakes/README.md then 06-create-modal.md. Build CreateStocktakeModal (FULL/FILTERED/BLANK +
estimated lines) + useCreateStocktake (insertStocktake) using 00's Modal and 01's search inputs +
usePreferences. Open it from SLOT:actions-new in ListView; on success navigate to the detail route
(/inventory/stocktakes/:id from 07). Exact fields/inputs are in the spec + the open-mSupply reference paths.
pnpm typecheck + build must pass. Do not commit.
```

## 07 — Detail view scaffold  (Wave 2)
```
Implement specs/stocktakes/07-detail-scaffold.md in /Users/aneesh/Projects/rnd-the-fe (00 is merged).
Read specs/stocktakes/README.md then 07-detail-scaffold.md. Add the /inventory/stocktakes/:id route + screen,
the detail data layer (StocktakeFragment + StocktakeLineFragment, stocktake/stocktakeLines queries,
updateStocktake), the line-error context, and the editable SidePanel + Toolbar. Leave the exact labelled
SLOTs (lines-table, line-edit-modal, detail-footer) + itemFilter signal + line-error context API stable —
08/09/10 depend on them. Must merge before 08/09/10. pnpm typecheck + build must pass. Do not commit.
```

## 08 — Detail lines table  (Wave 3 — needs 07)
```
Implement specs/stocktakes/08-detail-lines-table.md in /Users/aneesh/Projects/rnd-the-fe (07 + 01 merged).
Read specs/stocktakes/README.md then 08-detail-lines-table.md. Build lineColumns (full column set, preference-
gated via 01's usePreferences, error-cell highlight from 07's line-error context) and render the lines via
00's DataTable at SLOT:lines-table (server-side item search + row selection + row-click → openLineEdit).
Coordinate the openLineEdit(item, mode) contract with 09 and expose selected rows for 10. pnpm typecheck +
build must pass. Do not commit.
```

## 09 — Line-edit modal  (Wave 3 — needs 07 + 01)
```
Implement specs/stocktakes/09-line-edit-modal.md in /Users/aneesh/Projects/rnd-the-fe (07 + 01 merged).
Read specs/stocktakes/README.md then 09-line-edit-modal.md. Build the DraftStocktakeLine model + controller
(Solid store), the Batch/Pricing/Other tabbed editable tables, and useSaveStocktakeLines (batchStocktake
insert/update/delete + structured error mapping into 07's line-error context). Use 00's Modal + 01's search
inputs/reasons/prefs. Provide the openLineEdit handler at SLOT:line-edit-modal for 08. Fields/inputs/transforms
are in the spec + open-mSupply reference paths. pnpm typecheck + build must pass. Do not commit.
```

## 10 — Detail footer actions  (Wave 3 — needs 07)
```
Implement specs/stocktakes/10-detail-footer-actions.md in /Users/aneesh/Projects/rnd-the-fe (07 merged; coordinate with 09).
Read specs/stocktakes/README.md then 10-detail-footer-actions.md. Build the footer at SLOT:detail-footer:
lock toggle, status crumbs, Save-&-confirm→Finalised (updateStocktake, with error-modal on structured errors),
and selected-line actions (delete lines, change location, reduce to zero) with their confirm modals, plus
StocktakeErrorModal reading 07's line-error context. Reuse useSaveStocktakeLines (coordinate ownership with 09
— one creates, the other imports). pnpm typecheck + build must pass. Do not commit.
```
