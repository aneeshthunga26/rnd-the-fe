import { For, type JSX } from "solid-js";
import type { Table } from "@tanstack/solid-table";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "../icons";

interface TablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

/** Footer: "Showing X–Y of Z", rows-per-page selector, and page controls. */
export function TablePagination<TData>(props: TablePaginationProps<TData>): JSX.Element {
  const state = () => props.table.getState().pagination;
  const total = () => props.table.getFilteredRowModel().rows.length;
  const pageCount = () => props.table.getPageCount();

  const start = () => (total() === 0 ? 0 : state().pageIndex * state().pageSize + 1);
  const end = () => Math.min((state().pageIndex + 1) * state().pageSize, total());

  // A small window of page numbers around the current page.
  const pageWindow = () => {
    const count = pageCount();
    const current = state().pageIndex;
    const from = Math.max(0, Math.min(current - 2, count - 5));
    return Array.from({ length: Math.min(5, count) }, (_, i) => from + i);
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-md text-gray-menu hover:bg-row-hover disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div class="flex items-center justify-between px-2 py-3 text-sm text-gray-menu">
      <span>
        Showing <span class="font-medium">{start()}</span>–<span class="font-medium">{end()}</span> of{" "}
        <span class="font-medium">{total()}</span>
      </span>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2">
          Rows per page
          <select
            class="rounded-md border border-line px-2 py-1"
            value={state().pageSize}
            onChange={(e) => props.table.setPageSize(Number(e.currentTarget.value))}
          >
            <For each={props.pageSizeOptions ?? [20, 50, 100]}>
              {(size) => <option value={size}>{size}</option>}
            </For>
          </select>
        </label>

        <div class="flex items-center gap-1">
          <button class={iconBtn} onClick={() => props.table.firstPage()} disabled={!props.table.getCanPreviousPage()}>
            <ChevronsLeftIcon class="w-4 h-4" />
          </button>
          <button class={iconBtn} onClick={() => props.table.previousPage()} disabled={!props.table.getCanPreviousPage()}>
            <ChevronLeftIcon class="w-4 h-4" />
          </button>

          <For each={pageWindow()}>
            {(page) => (
              <button
                class={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 ${
                  page === state().pageIndex
                    ? "bg-brand font-medium text-white"
                    : "text-gray-menu hover:bg-row-hover"
                }`}
                onClick={() => props.table.setPageIndex(page)}
              >
                {page + 1}
              </button>
            )}
          </For>

          <button class={iconBtn} onClick={() => props.table.nextPage()} disabled={!props.table.getCanNextPage()}>
            <ChevronRightIcon class="w-4 h-4" />
          </button>
          <button class={iconBtn} onClick={() => props.table.lastPage()} disabled={!props.table.getCanNextPage()}>
            <ChevronsRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
