import { For, type JSX, Show } from "solid-js";
import { flexRender, type Row, type Table } from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { useIsMobile } from "../../lib/useMediaQuery";

interface DataTableProps<TData> {
  table: Table<TData>;
  /** Row height in px (used by the virtualizer). */
  rowHeight?: number;
  /** Scroll-area height (CSS value). */
  height?: string;
  /** Called when a row body / card is clicked. */
  onRowClick?: (row: TData) => void;
  /** Optional custom card renderer for mobile view; falls back to a generic card. */
  renderCard?: (row: TData) => JSX.Element;
}

/**
 * Generic, reusable table. On desktop: sticky styled header + virtualized body.
 * On mobile (< md breakpoint): the current page's rows render as stacked cards.
 */
export function DataTable<TData>(props: DataTableProps<TData>): JSX.Element {
  let scrollRef!: HTMLDivElement;
  const isMobile = useIsMobile();
  const rowHeight = () => props.rowHeight ?? 44;
  const height = () => props.height ?? "calc(100vh - 300px)";

  const rows = () => props.table.getRowModel().rows;
  const totalWidth = () => props.table.getTotalSize();

  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollRef,
    estimateSize: () => rowHeight(),
    overscan: 10,
  });

  // Generic card fallback: label/value per (string-headed) column.
  const genericCard = (row: Row<TData>) => (
    <For each={row.getVisibleCells()}>
      {(cell) => {
        const header = cell.column.columnDef.header;
        if (cell.column.id === "select" || typeof header !== "string") return null;
        const cellDef = cell.column.columnDef.cell;
        return (
          <div class="flex justify-between gap-4 py-0.5 text-sm">
            <span class="text-gray-muted">{header}</span>
            <span class="truncate text-right">
              {cellDef ? flexRender(cellDef, cell.getContext()) : String(cell.getValue() ?? "")}
            </span>
          </div>
        );
      }}
    </For>
  );

  return (
    <div class="flex flex-col overflow-hidden rounded-lg border border-line bg-page">
      <Show
        when={!isMobile()}
        fallback={
          <div style={{ height: height() }} class="space-y-3 overflow-auto p-3">
            <For each={rows()}>
              {(row) => (
                <div
                  class="cursor-pointer rounded-lg border border-line p-3 hover:bg-row-hover"
                  onClick={() => props.onRowClick?.(row.original)}
                >
                  {props.renderCard ? props.renderCard(row.original) : genericCard(row)}
                </div>
              )}
            </For>
          </div>
        }
      >
        <div ref={scrollRef} style={{ height: height() }} class="overflow-auto">
          <div style={{ "min-width": `${totalWidth()}px` }}>
            {/* Sticky header */}
            <div class="sticky top-0 z-10 flex border-b border-line bg-page text-xs font-medium uppercase tracking-wide text-gray-muted">
              <For each={props.table.getHeaderGroups()[0]?.headers ?? []}>
                {(header) => (
                  <div style={{ width: `${header.getSize()}px` }} class="flex items-center px-4 py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                )}
              </For>
            </div>

            {/* Virtualized body */}
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
              <For each={virtualizer.getVirtualItems()}>
                {(virtualRow) => {
                  const row = () => rows()[virtualRow.index];
                  return (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      class="flex cursor-pointer items-center border-b border-line text-sm text-[#3a3d44] hover:bg-row-hover"
                      onClick={() => props.onRowClick?.(row().original)}
                    >
                      <For each={row().getVisibleCells()}>
                        {(cell) => {
                          const cellDef = cell.column.columnDef.cell;
                          return (
                            <div
                              style={{ width: `${cell.column.getSize()}px` }}
                              class="flex items-center overflow-hidden px-4"
                            >
                              {cellDef ? (
                                flexRender(cellDef, cell.getContext())
                              ) : (
                                <span class="truncate">{String(cell.getValue() ?? "")}</span>
                              )}
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
