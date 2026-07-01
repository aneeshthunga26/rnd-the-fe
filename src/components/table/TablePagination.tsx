import { For, type JSX } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "../icons";
import { Select } from "../ui/Select";

interface TablePaginationProps {
  /** Total row count from the server. */
  total: number;
  /** Current 0-based page index. */
  pageIndex: number;
  /** Current page size. */
  pageSize: number;
  /** Set the page by 0-based index. */
  onPage: (pageIndex: number) => void;
  /** Set the page size. */
  onPageSize: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Server-driven pagination footer: "Showing X–Y of Z", rows-per-page selector,
 * and page controls. All derived from props (the server owns paging state).
 */
export function TablePagination(props: TablePaginationProps): JSX.Element {
  const pageCount = () => Math.max(1, Math.ceil(props.total / props.pageSize));
  const start = () => (props.total === 0 ? 0 : props.pageIndex * props.pageSize + 1);
  const end = () => Math.min((props.pageIndex + 1) * props.pageSize, props.total);

  // A small window of page numbers around the current page.
  const pageWindow = () => {
    const count = pageCount();
    const current = props.pageIndex;
    const from = Math.max(0, Math.min(current - 2, count - 5));
    return Array.from({ length: Math.min(5, count) }, (_, i) => from + i);
  };

  const canPrev = () => props.pageIndex > 0;
  const canNext = () => props.pageIndex < pageCount() - 1;

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-md text-gray-menu hover:bg-row-hover disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div class="flex items-center justify-between px-2 py-3 text-sm text-gray-menu">
      <span>
        Showing <span class="font-medium">{start()}</span>–<span class="font-medium">{end()}</span> of{" "}
        <span class="font-medium">{props.total}</span>
      </span>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          Rows per page
          <Select
            aria-label="Rows per page"
            value={String(props.pageSize)}
            onChange={(v) => props.onPageSize(Number(v))}
            options={(props.pageSizeOptions ?? [20, 50, 100]).map((s) => ({
              value: String(s),
              label: String(s),
            }))}
          />
        </div>

        <div class="flex items-center gap-1">
          <button class={iconBtn} onClick={() => props.onPage(0)} disabled={!canPrev()}>
            <ChevronsLeftIcon class="w-4 h-4" />
          </button>
          <button class={iconBtn} onClick={() => props.onPage(props.pageIndex - 1)} disabled={!canPrev()}>
            <ChevronLeftIcon class="w-4 h-4" />
          </button>

          <For each={pageWindow()}>
            {(page) => (
              <button
                class={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 ${
                  page === props.pageIndex
                    ? "bg-brand font-medium text-white"
                    : "text-gray-menu hover:bg-row-hover"
                }`}
                onClick={() => props.onPage(page)}
              >
                {page + 1}
              </button>
            )}
          </For>

          <button class={iconBtn} onClick={() => props.onPage(props.pageIndex + 1)} disabled={!canNext()}>
            <ChevronRightIcon class="w-4 h-4" />
          </button>
          <button class={iconBtn} onClick={() => props.onPage(pageCount() - 1)} disabled={!canNext()}>
            <ChevronsRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
