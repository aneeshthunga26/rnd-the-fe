import { type Component, createSignal, Show } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/solid-table";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { StocktakeLineErrorProvider } from "../../../../context/stocktakeLineError";
import { useI18n } from "../../../../intl";
import { ROUTES } from "../../../routes";
import { DataTable } from "../../../../components/table/DataTable";
import { ChevronLeftIcon, PlusCircleIcon } from "../../../../components/icons";
import {
  canDeleteStocktake,
  type StocktakeLine,
  type StocktakeLineListParams,
  type StocktakeLineSortKey,
  type UpdateStocktakePatch,
  useStocktake,
  useStocktakeDelete,
  useStocktakeLines,
  useUpdateStocktake,
} from "../api";
import { isStocktakeDisabled } from "../utils";
import { SidePanel } from "./SidePanel";
import { Toolbar } from "./Toolbar";
import { useLineColumns, isUncounted } from "./lineColumns";
import { StocktakeLineEditModal } from "./modal/StocktakeLineEditModal";
import type { DraftItem } from "./modal/draft";
import { Footer } from "./Footer/Footer";
import { StocktakeErrorModal } from "./StocktakeErrorModal";

const LINE_SORT_KEYS = new Set<StocktakeLineSortKey>([
  "itemCode",
  "itemName",
  "batch",
  "expiryDate",
  "packSize",
  "locationCode",
  "snapshotNumberOfPacks",
  "countedNumberOfPacks",
  "reasonOption",
]);

const DetailViewInner: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const id = () => params.id ?? "";

  const query = useStocktake(id);
  const updateMutation = useUpdateStocktake();
  const deleteMutation = useStocktakeDelete();

  // Item filter lives in the URL (server-side itemCodeOrName filter).
  const [sp, setSp] = useSearchParams();
  const itemFilter = () => (Array.isArray(sp.item) ? sp.item[0] : sp.item) ?? "";
  const setItemFilter = (value: string) => setSp({ item: value || undefined });

  const stocktake = () => query.data;
  const disabled = () => isStocktakeDisabled(stocktake());

  const update = (patch: Partial<UpdateStocktakePatch>) => {
    const s = stocktake();
    if (!s) return;
    void updateMutation.mutateAsync({ id: s.id, ...patch });
  };

  const onDelete = async () => {
    const s = stocktake();
    if (!s || !canDeleteStocktake(s)) return;
    await deleteMutation.mutateAsync([{ id: s.id }]);
    navigate(ROUTES.stocktakes);
  };
  const onCopy = () => {
    const s = stocktake();
    if (s) void navigator.clipboard?.writeText(JSON.stringify(s, null, 2));
  };

  // ── Lines table (08) ────────────────────────────────────────────────────────
  const [lineSort, setLineSort] = createSignal<{ key: StocktakeLineSortKey; desc: boolean }>({
    key: "itemName",
    desc: false,
  });
  const lineParams = (): StocktakeLineListParams => ({
    sortBy: lineSort(),
    filterBy: itemFilter() ? { itemCodeOrName: { like: itemFilter() } } : undefined,
  });
  const linesQuery = useStocktakeLines(id, lineParams);
  const lineColumns = useLineColumns();

  const [rowSelection, setRowSelection] = createSignal<RowSelectionState>({});
  const sortingState = (): SortingState => [{ id: lineSort().key, desc: lineSort().desc }];

  const table = createSolidTable<StocktakeLine>({
    get data() {
      return linesQuery.data?.rows ?? [];
    },
    get columns() {
      return lineColumns();
    },
    state: {
      get rowSelection() {
        return rowSelection();
      },
      get sorting() {
        return sortingState();
      },
    },
    getRowId: (row) => row.id,
    get enableRowSelection() {
      return !disabled();
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sortingState()) : updater;
      const first = next[0];
      if (first && LINE_SORT_KEYS.has(first.id as StocktakeLineSortKey)) {
        setLineSort({ key: first.id as StocktakeLineSortKey, desc: first.desc });
      }
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRows = () => table.getSelectedRowModel().rows.map((r) => r.original);
  const allLines = () => linesQuery.data?.rows ?? [];

  // Finalise gate — computed from the UNFILTERED document count so an active item
  // filter can't wrongly disable finalise. The "all uncounted" heuristic only
  // applies when no filter is active (otherwise the server governs).
  const disableFinalise = () => {
    const s = stocktake();
    if (!s || s.lines.totalCount === 0) return true;
    if (itemFilter()) return false;
    return allLines().every((l) => l.countedNumberOfPacks == null);
  };

  // ── Line-edit modal (09) ────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = createSignal(false);
  const [editMode, setEditMode] = createSignal<"create" | "update">("update");
  const [editItem, setEditItem] = createSignal<DraftItem | null>(null);
  const openLineEdit = (item: DraftItem | null, mode: "create" | "update" = "update") => {
    setEditMode(mode);
    setEditItem(item);
    setEditOpen(true);
  };

  return (
    <div class="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div class="flex items-center gap-3 px-3 pt-3 md:px-6">
        <button
          type="button"
          class="flex items-center gap-1 text-sm text-brand hover:underline"
          onClick={() => navigate(ROUTES.stocktakes)}
        >
          <ChevronLeftIcon class="h-4 w-4" /> {t("app.stocktakes")}
        </button>
        <Show when={stocktake()}>
          {(s) => (
            <div class="flex flex-1 items-center gap-2">
              <span class="text-lg font-semibold">
                {t("app.stocktake")} #{s().stocktakeNumber}
              </span>
              <span class="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
                {s().isLocked ? t("status.on-hold") : s().status}
              </span>
              <Show when={!disabled()}>
                <button
                  type="button"
                  class="ms-auto flex items-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
                  onClick={() => openLineEdit(null, "create")}
                >
                  <PlusCircleIcon class="h-4 w-4" /> {t("action.add-item")}
                </button>
              </Show>
            </div>
          )}
        </Show>
      </div>

      <Show
        when={!query.isError}
        fallback={
          <div class="p-6">
            <p class="text-danger">{t("message.stocktake-not-found")}</p>
            <button
              class="mt-2 text-sm text-brand hover:underline"
              onClick={() => navigate(ROUTES.stocktakes)}
            >
              {t("action.return-to-stocktakes")}
            </button>
          </div>
        }
      >
        <Show
          when={stocktake()}
          fallback={<div class="p-6 text-muted">{t("message.loading-stocktake")}</div>}
        >
          {(s) => (
            <div class="flex flex-1 overflow-hidden">
              <main class="flex flex-1 flex-col overflow-hidden px-3 pb-2 md:px-6">
                <Toolbar
                  stocktake={s()}
                  disabled={disabled()}
                  onUpdate={update}
                  itemFilter={itemFilter}
                  setItemFilter={setItemFilter}
                />

                {/* SLOT:lines-table — 08 */}
                <div class="flex-1 overflow-hidden">
                  <DataTable
                    table={table}
                    height="calc(100vh - 320px)"
                    onRowClick={(row) => openLineEdit(row.item)}
                    rowClass={(row) => (isUncounted(row) ? "text-muted" : undefined)}
                  />
                </div>

                {/* SLOT:detail-footer — 10 */}
                <Footer
                  stocktake={s()}
                  disabled={disabled()}
                  selectedRows={selectedRows()}
                  allLines={allLines()}
                  disableFinalise={disableFinalise()}
                  resetSelection={() => table.resetRowSelection()}
                />
              </main>

              <SidePanel
                stocktake={s()}
                disabled={disabled()}
                onUpdate={update}
                onDelete={onDelete}
                onCopy={onCopy}
              />
            </div>
          )}
        </Show>
      </Show>

      {/* SLOT:line-edit-modal — 09 */}
      <StocktakeLineEditModal
        open={editOpen()}
        mode={editMode()}
        item={editItem()}
        setItem={setEditItem}
        disabled={disabled()}
        stocktakeId={id}
        existingLines={allLines}
        onClose={() => setEditOpen(false)}
      />

      <StocktakeErrorModal />
    </div>
  );
};

/** Route entry for /inventory/stocktakes/:id. Wrapped in the line-error context. */
const DetailView: Component = () => (
  <StocktakeLineErrorProvider>
    <DetailViewInner />
  </StocktakeLineErrorProvider>
);

export default DetailView;
