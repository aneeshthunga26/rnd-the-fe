import { createEffect, For, type JSX, Show } from "solid-js";
import { type Cell, flexRender, type Header, type Row, type Table } from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { useIsMobile } from "../../lib/useMediaQuery";

export type Density = "compact" | "comfortable" | "spacious";

const ROW_HEIGHT: Record<Density, number> = {
  compact: 32,
  comfortable: 44,
  spacious: 56,
};

interface DataTableProps<TData> {
  table: Table<TData>;
  /** Row density → row height + padding. Defaults to comfortable. */
  density?: Density;
  /** Scroll-area height (CSS value). */
  height?: string;
  /** Called when a row body / card is clicked. */
  onRowClick?: (row: TData) => void;
  /** Optional custom card renderer for mobile view; falls back to a generic card. */
  renderCard?: (row: TData) => JSX.Element;
  /** Optional extra classes per row (e.g. muted styling for placeholder rows). */
  rowClass?: (row: TData) => string | undefined;
}

/** Sticky-offset + z-index styles for a pinned column (left/right), else {}. */
function pinnedStyle<TData>(
  column: Cell<TData, unknown>["column"] | Header<TData, unknown>["column"],
): JSX.CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  return {
    position: "sticky",
    "z-index": 1,
    "background-color": "inherit",
    // Logical insets so pinning mirrors under RTL (identical to left/right in LTR).
    ...(pinned === "left"
      ? { "inset-inline-start": `${column.getStart("left")}px` }
      : { "inset-inline-end": `${column.getAfter("right")}px` }),
  };
}

/**
 * Generic, controlled table. Renders purely from the TanStack table instance's
 * state (selection, visibility, order, pinning, sizing, sorting). Desktop: sticky
 * styled header + virtualized body; mobile (< md): the page's rows as cards.
 */
export function DataTable<TData>(props: DataTableProps<TData>): JSX.Element {
  let scrollRef!: HTMLDivElement;
  const isMobile = useIsMobile();
  const density = () => props.density ?? "comfortable";
  const rowHeight = () => ROW_HEIGHT[density()];
  // With an explicit `height` the scroll area is fixed; without one it flexes to
  // fill the parent (min-h-0 + flex-1), so it doesn't leave whitespace below.
  const height = () => props.height;
  const fill = () => !props.height;

  const rows = () => props.table.getRowModel().rows;
  const totalWidth = () => props.table.getTotalSize();

  // Left-pinned → center → right-pinned, so headers and cells share one order.
  const headers = () => {
    const t = props.table;
    return [
      ...(t.getLeftHeaderGroups().at(-1)?.headers ?? []),
      ...(t.getCenterHeaderGroups().at(-1)?.headers ?? []),
      ...(t.getRightHeaderGroups().at(-1)?.headers ?? []),
    ];
  };
  const cellsOf = (row: Row<TData>) => [
    ...row.getLeftVisibleCells(),
    ...row.getCenterVisibleCells(),
    ...row.getRightVisibleCells(),
  ];

  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollRef,
    estimateSize: () => rowHeight(),
    overscan: 10,
  });

  // Density changes the row height → re-measure the virtualizer.
  createEffect(() => {
    rowHeight();
    virtualizer.measure();
  });

  const sortIndicator = (dir: false | "asc" | "desc") => (dir === "asc" ? "▲" : dir === "desc" ? "▼" : "");

  // Generic card fallback: label/value per (string-headed) column.
  const genericCard = (row: Row<TData>) => (
    <For each={row.getVisibleCells()}>
      {(cell) => {
        const header = cell.column.columnDef.header;
        if (cell.column.id === "select" || typeof header !== "string") return null;
        const cellDef = cell.column.columnDef.cell;
        return (
          <div class="flex justify-between gap-4 py-0.5 text-sm">
            <span class="text-muted">{header}</span>
            <span class="truncate text-end">
              {cellDef ? flexRender(cellDef, cell.getContext()) : String(cell.getValue() ?? "")}
            </span>
          </div>
        );
      }}
    </For>
  );

  return (
    <div
      class="flex flex-col overflow-hidden rounded-lg border border-line bg-bg"
      classList={{ "min-h-0 flex-1": fill() }}
    >
      <Show
        when={!isMobile()}
        fallback={
          // Mobile (< md): plain (non-virtualized) card list. Fine while page sizes
          // stay modest (server-paginated ~20). If a screen ever uses a large/"all"
          // page size on mobile, reuse the virtualizer here (estimate a card height).
          <div
            style={height() ? { height: height() } : undefined}
            class="space-y-3 overflow-auto p-3"
            classList={{ "min-h-0 flex-1": fill() }}
          >
            <For each={rows()}>
              {(row) => (
                <div
                  class="cursor-pointer rounded-lg border border-line p-3 hover:bg-row-hover"
                  classList={{ "bg-brand-light/40": row.getIsSelected() }}
                  onClick={() => props.onRowClick?.(row.original)}
                >
                  {props.renderCard ? props.renderCard(row.original) : genericCard(row)}
                </div>
              )}
            </For>
          </div>
        }
      >
        <div
          ref={scrollRef}
          style={height() ? { height: height() } : undefined}
          class="overflow-auto"
          classList={{ "min-h-0 flex-1": fill() }}
        >
          <div style={{ "min-width": `${totalWidth()}px` }}>
            {/* Sticky header */}
            <div
              class="sticky top-0 z-20 flex border-b border-line bg-bg text-xs font-medium uppercase tracking-wide text-muted"
              style={{ height: `${rowHeight()}px` }}
            >
              <For each={headers()}>
                {(header) => {
                  const canSort = () => header.column.getCanSort();
                  return (
                    <div
                      style={{ width: `${header.getSize()}px`, ...pinnedStyle(header.column) }}
                      class="group relative flex items-center gap-1 bg-bg px-4"
                      classList={{ "cursor-pointer select-none": canSort() }}
                      onClick={canSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span class="truncate">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <Show when={header.column.getIsSorted()}>
                        <span class="text-[10px] text-brand">
                          {sortIndicator(header.column.getIsSorted())}
                        </span>
                      </Show>
                      <Show when={header.column.getCanResize()}>
                        {/* Persistent separator marks the column edge; the wider
                            transparent area is the resize grab target. */}
                        <div
                          class="absolute end-0 top-0 z-10 flex h-full w-3 cursor-col-resize items-center justify-end"
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            class="h-1/2 w-px bg-line group-hover:bg-brand"
                            classList={{ "bg-brand": header.column.getIsResizing() }}
                          />
                        </div>
                      </Show>
                    </div>
                  );
                }}
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
                      class={`flex cursor-pointer items-center border-b border-line bg-bg text-sm text-fg hover:bg-row-hover ${
                        props.rowClass?.(row().original) ?? ""
                      }`}
                      classList={{ "bg-brand-light/40 hover:bg-brand-light/50": row().getIsSelected() }}
                      onClick={() => props.onRowClick?.(row().original)}
                    >
                      <For each={cellsOf(row())}>
                        {(cell) => (
                          <div
                            style={{
                              width: `${cell.column.getSize()}px`,
                              ...pinnedStyle(cell.column),
                            }}
                            class="flex items-center overflow-hidden px-4"
                          >
                            {cell.column.columnDef.cell ? (
                              flexRender(cell.column.columnDef.cell, cell.getContext())
                            ) : (
                              <span class="truncate">{String(cell.getValue() ?? "")}</span>
                            )}
                          </div>
                        )}
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
