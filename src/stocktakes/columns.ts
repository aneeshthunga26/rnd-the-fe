import type { ColumnDef } from "@tanstack/solid-table";
import type { StocktakeRow } from "./api";

// Column definitions for the stocktakes list. Every column has an explicit `id`
// (accessorFn columns require it, and column-visibility state is keyed by id).
// Headers are plain strings and values render raw — no styling/formatting yet.

export const columns: ColumnDef<StocktakeRow>[] = [
  {
    id: "stocktakeNumber",
    accessorKey: "stocktakeNumber",
    header: "Number",
  },
  {
    id: "status",
    header: "Status",
    // Locked rows display as "On Hold" (mirrors the open-mSupply list view)...
    accessorFn: (row) => (row.isLocked ? "On Hold" : row.status),
    // ...but the status filter matches the underlying enum, not the display text.
    filterFn: (row, _columnId, filterValue) =>
      !filterValue || row.original.status === filterValue,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    // Free-text search column: matches across description + comment.
    filterFn: (row, _columnId, filterValue) => {
      const needle = String(filterValue ?? "").toLowerCase();
      if (!needle) return true;
      const { description, comment } = row.original;
      return `${description} ${comment}`.toLowerCase().includes(needle);
    },
  },
  {
    id: "createdDatetime",
    accessorKey: "createdDatetime",
    header: "Created",
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: "Comment",
  },
];

// Fixed column width (px) used purely for structural alignment of the
// virtualized <div> rows. Not styling — just so cells line up under headers.
export const COLUMN_WIDTH = 200;
