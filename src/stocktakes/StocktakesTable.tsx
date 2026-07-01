import { type Component, For } from "solid-js";
import { flexRender, type Table } from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { COLUMN_WIDTH } from "./columns";
import type { StocktakeRow } from "./api";

interface StocktakesTableProps {
  table: Table<StocktakeRow>;
}

const ROW_HEIGHT = 32;

/**
 * Presentational table: a flat header row, a virtualized body, and a pager.
 * Rows are <div>s (not a semantic <table>) because virtual rows are absolutely
 * positioned — inline widths are structural alignment, not styling.
 */
export const StocktakesTable: Component<StocktakesTableProps> = (props) => {
  let scrollRef!: HTMLDivElement;

  // Current page's rows (already filtered + paginated by the table).
  const rows = () => props.table.getRowModel().rows;

  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollRef,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const pagination = () => props.table.getState().pagination;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", "font-weight": "bold", "border-bottom": "2px solid #000" }}>
        <For each={props.table.getHeaderGroups()[0]?.headers ?? []}>
          {(header) => (
            <div style={{ width: `${COLUMN_WIDTH}px`, padding: "4px" }}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          )}
        </For>
      </div>

      {/* Virtualized body */}
      <div ref={scrollRef} style={{ height: "500px", overflow: "auto", border: "1px solid #ccc" }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative", width: "100%" }}>
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
                    display: "flex",
                    "border-bottom": "1px solid #eee",
                  }}
                >
                  <For each={row().getVisibleCells()}>
                    {(cell) => (
                      <div style={{ width: `${COLUMN_WIDTH}px`, padding: "4px", overflow: "hidden" }}>
                        {String(cell.getValue() ?? "")}
                      </div>
                    )}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* Pager */}
      <div style={{ display: "flex", "align-items": "center", gap: "8px", "margin-top": "8px" }}>
        <button onClick={() => props.table.firstPage()} disabled={!props.table.getCanPreviousPage()}>
          {"<<"}
        </button>
        <button onClick={() => props.table.previousPage()} disabled={!props.table.getCanPreviousPage()}>
          {"<"}
        </button>
        <button onClick={() => props.table.nextPage()} disabled={!props.table.getCanNextPage()}>
          {">"}
        </button>
        <button onClick={() => props.table.lastPage()} disabled={!props.table.getCanNextPage()}>
          {">>"}
        </button>
        <span>
          Page {pagination().pageIndex + 1} of {props.table.getPageCount()}
        </span>
        <span>({props.table.getFilteredRowModel().rows.length} rows)</span>
      </div>
    </div>
  );
};
