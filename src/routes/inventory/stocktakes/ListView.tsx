import { type Component, createSignal, Show } from "solid-js";
import {
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  createSolidTable,
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/solid-table";
import { useNavigate } from "@solidjs/router";
import { PageActions } from "../../../components/layout/PageHeader";
import { type Density, DataTable } from "../../../components/table/DataTable";
import { FilterBar } from "../../../components/table/FilterBar";
import { TablePagination } from "../../../components/table/TablePagination";
import { TableToolbar, toolbarBtnClass } from "../../../components/table/TableToolbar";
import { ColumnPickerMenu } from "../../../components/table/ColumnPickerMenu";
import { TableSettingsMenu } from "../../../components/table/TableSettingsMenu";
import { FullscreenContainer } from "../../../components/table/FullscreenContainer";
import { useFullscreen } from "../../../components/table/useFullscreen";
import { SelectionFooter } from "../../../components/table/SelectionFooter";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Select } from "../../../components/ui/Select";
import { CreateStocktakeModal } from "./CreateStocktakeModal";
import {
  ChevronDownIcon,
  DeleteIcon,
  FullscreenIcon,
  PlusCircleIcon,
  UploadIcon,
} from "../../../components/icons";
import { useIsMobile } from "../../../lib/useMediaQuery";
import { useUrlQueryParams } from "../../../lib/useUrlQueryParams";
import { usePersistedTableState } from "../../../lib/persistTableState";
import { useFormat, useI18n, type Formatters } from "../../../intl";
import {
  canDeleteStocktake,
  type StocktakeFilter,
  type StocktakeListParams,
  type StocktakeRow,
  type StocktakeSortKey,
  useStocktakeDelete,
  useStocktakes,
} from "./api";
import { useStocktakeColumns } from "./columns";

const SORT_KEYS = new Set<StocktakeSortKey>([
  "stocktakeNumber",
  "status",
  "description",
  "comment",
  "createdDatetime",
  "finalisedDatetime",
  "stocktakeDate",
]);

// Mobile card for a stocktake row.
const renderStocktakeCard = (row: StocktakeRow, t: ReturnType<typeof useI18n>["t"], fmt: Formatters) => (
  <div>
    <div class="flex items-center justify-between">
      <span class="font-semibold">#{row.stocktakeNumber}</span>
      <span class="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
        {row.isLocked ? t("status.on-hold") : row.status}
      </span>
    </div>
    <div class="mt-1 text-sm">{row.description}</div>
    <div class="mt-1 text-xs text-muted">{fmt.formatDate(row.createdDatetime)}</div>
  </div>
);

export const ListView: Component = () => {
  const { t } = useI18n();
  const fmt = useFormat();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const columns = useStocktakeColumns();
  const url = useUrlQueryParams({ initialSort: { key: "createdDatetime", dir: "desc" }, pageSize: 20 });

  // Map the URL's raw filter record → the server's typed StocktakeFilter.
  const listParams = (): StocktakeListParams => {
    const qp = url.queryParams();
    const filterBy: StocktakeFilter = {};
    const status = qp.filterBy.status;
    if (status === "NEW" || status === "FINALISED") filterBy.status = { equalTo: status };
    const key = qp.sortBy?.key as StocktakeSortKey | undefined;
    return {
      first: qp.first,
      offset: qp.offset,
      sortBy: key && SORT_KEYS.has(key) ? { key, desc: qp.sortBy!.desc } : undefined,
      filterBy: Object.keys(filterBy).length ? filterBy : undefined,
    };
  };

  const query = useStocktakes(listParams);

  // Controlled table state — signals so Wave-2 menus (columns / settings) can drive them.
  const [rowSelection, setRowSelection] = createSignal<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});
  const [columnOrder, setColumnOrder] = createSignal<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = createSignal<ColumnPinningState>({ left: [], right: [] });
  const [columnSizing, setColumnSizing] = createSignal<ColumnSizingState>({});
  const [density, setDensity] = createSignal<Density>("comfortable");

  // Persist table state (density / visibility / order / pinning / sizing) — 05.
  const persisted = usePersistedTableState("stocktake-list", {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnPinning,
    setColumnPinning,
    columnSizing,
    setColumnSizing,
    density,
    setDensity,
  });

  // Fullscreen toggle — 04.
  const fs = useFullscreen();

  // Create-stocktake modal — 06.
  const [createOpen, setCreateOpen] = createSignal(false);

  // Selection delete — 02.
  const del = useStocktakeDelete();
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const selectedRows = () => table.getSelectedRowModel().rows.map((r) => r.original);
  const undeletable = () => selectedRows().some((r) => !canDeleteStocktake(r));
  const doDelete = async () => {
    await del.mutateAsync(selectedRows());
    table.resetRowSelection();
    setConfirmOpen(false);
  };

  const sortingState = (): SortingState => {
    const s = url.sort();
    return s ? [{ id: s.key, desc: s.dir === "desc" }] : [];
  };

  const table = createSolidTable<StocktakeRow>({
    get data() {
      return query.data?.rows ?? [];
    },
    get columns() {
      return columns();
    },
    state: {
      get rowSelection() {
        return rowSelection();
      },
      get sorting() {
        return sortingState();
      },
      get columnVisibility() {
        return columnVisibility();
      },
      get columnOrder() {
        return columnOrder();
      },
      get columnPinning() {
        return columnPinning();
      },
      get columnSizing() {
        return columnSizing();
      },
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: false,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sortingState()) : updater;
      const first = next[0];
      if (first) url.setSort(first.id);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Desktop action buttons are teleported into the layout's AppBar.
          On mobile the app bar is hidden (title lives in the shell top bar) and
          the actions collapse to icons rendered inline on the filter row below. */}
      <PageActions>
        {/* SLOT:actions-new — 06 */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          class="flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          <PlusCircleIcon class="w-5 h-5" /> {t("action.new-stocktake")}
        </button>
        <div class="flex items-stretch overflow-hidden rounded-full border border-brand text-brand">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-brand-light"
          >
            <UploadIcon class="w-5 h-5" /> {t("action.export-csv")}
          </button>
          <button type="button" class="border-s border-brand px-2 hover:bg-brand-light">
            <ChevronDownIcon class="w-4 h-4" />
          </button>
        </div>
      </PageActions>

      <div class="flex flex-1 flex-col overflow-hidden px-3 pb-4 md:px-6">
        <FilterBar
          leading={
            <Show when={isMobile()}>
              {/* SLOT:actions-new (mobile) — 06 */}
              <button
                type="button"
                title={t("action.new-stocktake")}
                onClick={() => setCreateOpen(true)}
                class="flex h-9 w-9 items-center justify-center rounded-full border border-brand text-brand hover:bg-brand-light"
              >
                <PlusCircleIcon class="w-5 h-5" />
              </button>
              <div class="flex items-stretch overflow-hidden rounded-full border border-brand text-brand">
                <button
                  type="button"
                  title={t("action.export-csv")}
                  class="flex items-center px-2.5 hover:bg-brand-light"
                >
                  <UploadIcon class="w-5 h-5" />
                </button>
                <button type="button" class="border-s border-brand px-1.5 hover:bg-brand-light">
                  <ChevronDownIcon class="w-4 h-4" />
                </button>
              </div>
            </Show>
          }
        >
          <Select
            aria-label={t("label.filter-by-status")}
            placeholder={t("label.status")}
            clearable
            class="min-w-[9rem]"
            value={url.getFilter("status") ?? ""}
            onChange={(v) => url.setFilter("status", v)}
            options={[
              { value: "NEW", label: t("status.new") },
              { value: "FINALISED", label: t("status.finalised") },
            ]}
          />
        </FilterBar>

        {/* Table region — toolbar buttons + table + pagination.
            04 (fullscreen) wraps this whole region; the filter bar above stays out. */}
        <FullscreenContainer isFullscreen={fs.isFullscreen()}>
          <TableToolbar
            columns={/* SLOT:toolbar-columns — 03 */ <ColumnPickerMenu table={table} />}
            fullscreen={
              /* SLOT:toolbar-fullscreen — 04 */
              <button
                class={toolbarBtnClass}
                title={fs.isFullscreen() ? t("action.exit-fullscreen") : t("action.fullscreen")}
                type="button"
                onClick={fs.toggle}
              >
                <FullscreenIcon />
              </button>
            }
            settings={
              /* SLOT:toolbar-settings — 05 */
              <TableSettingsMenu persisted={persisted} density={density} setDensity={setDensity} />
            }
          />

          <Show
            when={!query.isError}
            fallback={
              <div class="p-6 text-danger">
                {t("message.load-stocktakes-failed", { error: String(query.error) })}
              </div>
            }
          >
            <Show
              when={query.data || !query.isPending}
              fallback={<div class="p-6 text-muted">{t("message.loading-stocktakes")}</div>}
            >
              <DataTable
                table={table}
                density={density()}
                renderCard={(row) => renderStocktakeCard(row, t, fmt())}
                onRowClick={(row) => navigate(`/inventory/stocktakes/${row.id}`)}
              />
              <TablePagination
                total={query.data?.totalCount ?? 0}
                pageIndex={url.pagination().pageIndex}
                pageSize={url.pagination().pageSize}
                onPage={url.setPage}
                onPageSize={url.setPageSize}
                pageSizeOptions={[20, 50, 100]}
              />
            </Show>
          </Show>
        </FullscreenContainer>

        {/* SLOT:selection-footer — 02 */}
        <SelectionFooter
          count={selectedRows().length}
          onClear={() => table.resetRowSelection()}
          actions={[
            {
              label: t("action.delete"),
              tone: "danger",
              icon: <DeleteIcon class="h-4 w-4" />,
              disabled: undeletable(),
              title: undeletable() ? t("message.cannot-delete-selected") : undefined,
              onClick: () => setConfirmOpen(true),
            },
          ]}
        />
      </div>

      <ConfirmModal
        open={confirmOpen()}
        tone="danger"
        title={t("message.delete-stocktakes-title")}
        message={t("message.confirm-delete-stocktakes", { count: selectedRows().length })}
        confirmLabel={t("action.delete")}
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <CreateStocktakeModal open={createOpen()} onOpenChange={setCreateOpen} />
    </>
  );
};
