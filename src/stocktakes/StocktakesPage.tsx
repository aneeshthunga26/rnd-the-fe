import { type Component, createResource, For, Show } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/solid-table";
import { listStocktakes } from "../mockApi";
import { columns } from "./columns";
import { StocktakesTable } from "./StocktakesTable";

const PAGE_SIZE = 20;

export const StocktakesPage: Component = () => {
  // Naive data layer: fetch all rows once (mock API, ~250ms delay).
  const [data] = createResource(listStocktakes);

  // Uncontrolled table state (the table owns filters/pagination/visibility);
  // we read it back reactively and drive it through the table's own methods.
  const table = createSolidTable({
    get data() {
      return data() ?? [];
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const statusColumn = () => table.getColumn("status");
  const searchColumn = () => table.getColumn("description");

  // Reset to the first page whenever a filter changes (avoids landing on an
  // out-of-range page after filtering shrinks the result set).
  const setFilter = (column: ReturnType<typeof statusColumn>, value: string) => {
    column?.setFilterValue(value || undefined);
    table.setPageIndex(0);
  };

  return (
    <div style={{ padding: "16px", "font-family": "sans-serif" }}>
      <h1>Stocktakes</h1>

      {/* Filter controls */}
      <div style={{ display: "flex", gap: "16px", "align-items": "center", "margin-bottom": "12px" }}>
        <label>
          Status:{" "}
          <select
            value={(statusColumn()?.getFilterValue() as string) ?? ""}
            onChange={(e) => setFilter(statusColumn(), e.currentTarget.value)}
          >
            <option value="">All</option>
            <option value="NEW">NEW</option>
            <option value="FINALISED">FINALISED</option>
          </select>
        </label>
        <label>
          Search:{" "}
          <input
            type="text"
            placeholder="description or comment"
            value={(searchColumn()?.getFilterValue() as string) ?? ""}
            onInput={(e) => setFilter(searchColumn(), e.currentTarget.value)}
          />
        </label>
      </div>

      {/* Column show/hide */}
      <div style={{ display: "flex", gap: "12px", "margin-bottom": "12px" }}>
        <span>Columns:</span>
        <For each={table.getAllLeafColumns()}>
          {(column) => (
            <label>
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />{" "}
              {column.id}
            </label>
          )}
        </For>
      </div>

      <Show when={!data.loading} fallback={<div>Loading stocktakes…</div>}>
        <StocktakesTable table={table} />
      </Show>
    </div>
  );
};
