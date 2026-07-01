import { type Component, Show } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/solid-table";
import { PageActions } from "../../../components/layout/PageHeader";
import { DataTable } from "../../../components/table/DataTable";
import { FilterBar } from "../../../components/table/FilterBar";
import { TablePagination } from "../../../components/table/TablePagination";
import { TableToolbar } from "../../../components/table/TableToolbar";
import { ChevronDownIcon, PlusCircleIcon, UploadIcon } from "../../../components/icons";
import { useIsMobile } from "../../../lib/useMediaQuery";
import { type StocktakeRow, useStocktakes } from "./api";
import { columns, formatDate } from "./columns";

const PAGE_SIZE = 20;

// Mobile card for a stocktake row.
const renderStocktakeCard = (row: StocktakeRow) => (
  <div>
    <div class="flex items-center justify-between">
      <span class="font-semibold">#{row.stocktakeNumber}</span>
      <span class="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
        {row.isLocked ? "On Hold" : row.status}
      </span>
    </div>
    <div class="mt-1 text-sm">{row.description}</div>
    <div class="mt-1 text-xs text-gray-muted">{formatDate(row.createdDatetime)}</div>
  </div>
);

export const ListView: Component = () => {
  const isMobile = useIsMobile();
  const query = useStocktakes();

  const table = createSolidTable({
    get data() {
      return query.data ?? [];
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
  });

  const statusColumn = () => table.getColumn("status");
  const setStatus = (value: string) => {
    statusColumn()?.setFilterValue(value || undefined);
    table.setPageIndex(0);
  };

  return (
    <>
      {/* Desktop action buttons are teleported into the layout's AppBar.
          On mobile the app bar is hidden (title lives in the shell top bar) and
          the actions collapse to icons rendered inline on the filter row below. */}
      <PageActions>
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          <PlusCircleIcon class="w-5 h-5" /> New stocktake
        </button>
        <div class="flex items-stretch overflow-hidden rounded-full border border-brand text-brand">
          <button type="button" class="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-brand-light">
            <UploadIcon class="w-5 h-5" /> Export CSV
          </button>
          <button type="button" class="border-l border-brand px-2 hover:bg-brand-light">
            <ChevronDownIcon class="w-4 h-4" />
          </button>
        </div>
      </PageActions>

      <div class="flex flex-1 flex-col overflow-hidden px-3 pb-4 md:px-6">
        <FilterBar
          leading={
            <Show when={isMobile()}>
              <button
                type="button"
                title="New stocktake"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-brand text-brand hover:bg-brand-light"
              >
                <PlusCircleIcon class="w-5 h-5" />
              </button>
              <div class="flex items-stretch overflow-hidden rounded-full border border-brand text-brand">
                <button type="button" title="Export CSV" class="flex items-center px-2.5 hover:bg-brand-light">
                  <UploadIcon class="w-5 h-5" />
                </button>
                <button type="button" class="border-l border-brand px-1.5 hover:bg-brand-light">
                  <ChevronDownIcon class="w-4 h-4" />
                </button>
              </div>
            </Show>
          }
        >
          <select
            class="rounded-lg border border-line bg-page px-3 py-2 text-sm text-gray-menu hover:bg-row-hover"
            value={(statusColumn()?.getFilterValue() as string) ?? ""}
            onChange={(e) => setStatus(e.currentTarget.value)}
          >
            <option value="">Status</option>
            <option value="NEW">New</option>
            <option value="FINALISED">Finalised</option>
          </select>
        </FilterBar>

        <TableToolbar />

        <Show
          when={!query.isError}
          fallback={<div class="p-6 text-red-600">Failed to load stocktakes: {String(query.error)}</div>}
        >
          <Show when={!query.isPending} fallback={<div class="p-6 text-gray-muted">Loading stocktakes…</div>}>
            <DataTable table={table} renderCard={renderStocktakeCard} />
            <TablePagination table={table} pageSizeOptions={[20, 50, 100]} />
          </Show>
        </Show>
      </div>
    </>
  );
};
