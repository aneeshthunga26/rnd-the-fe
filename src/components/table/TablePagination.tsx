import { For, type JSX } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "../icons";
import { useI18n } from "../../intl";
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
  const { t } = useI18n();
  const pageCount = () => Math.max(1, Math.ceil(props.total / props.pageSize));
  const start = () => (props.total === 0 ? 0 : props.pageIndex * props.pageSize + 1);
  const end = () => Math.min((props.pageIndex + 1) * props.pageSize, props.total);

  // A small window of page numbers centered on the current page.
  const pageWindow = () => {
    const count = pageCount();
    const size = Math.min(5, count);
    const from = Math.max(0, Math.min(props.pageIndex - 2, count - size));
    return Array.from({ length: size }, (_, i) => from + i);
  };

  const canPrev = () => props.pageIndex > 0;
  const canNext = () => props.pageIndex < pageCount() - 1;

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-md text-fg hover:bg-row-hover disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div class="flex flex-col items-center gap-3 px-2 py-3 text-sm text-fg sm:flex-row sm:justify-between sm:gap-4">
      {/* Range summary and rows-per-page are hidden on mobile — only page nav remains. */}
      <span class="hidden whitespace-nowrap sm:inline">
        {t("message.showing-range", { start: start(), end: end(), total: props.total })}
      </span>

      <div class="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <div class="hidden items-center gap-2 whitespace-nowrap sm:flex">
          {t("label.rows-per-page")}
          <Select
            aria-label={t("label.rows-per-page")}
            value={String(props.pageSize)}
            onChange={(v) => props.onPageSize(Number(v))}
            options={(props.pageSizeOptions ?? [20, 50, 100]).map((s) => ({
              value: String(s),
              label: String(s),
            }))}
          />
        </div>

        <div class="flex items-center gap-1">
          {/* Jump-to-first/last are hidden on narrow phones to keep the row compact. */}
          <button class={`${iconBtn} hidden sm:flex`} onClick={() => props.onPage(0)} disabled={!canPrev()}>
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
                    ? "bg-brand font-medium text-on-brand"
                    : "text-fg hover:bg-row-hover"
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
          <button
            class={`${iconBtn} hidden sm:flex`}
            onClick={() => props.onPage(pageCount() - 1)}
            disabled={!canNext()}
          >
            <ChevronsRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
