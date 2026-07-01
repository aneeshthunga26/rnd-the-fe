import type { ColumnDef } from "@tanstack/solid-table";
import type { StocktakeRow } from "./api";
import { CommentIcon } from "../../../components/icons";

// dd/mm/yyyy to mirror the reference UI (display-only formatting).
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
};

// Column definitions for the stocktakes list. Every column has an explicit `id`
// (accessorFn columns require it, and column-visibility state is keyed by id).
export const columns: ColumnDef<StocktakeRow>[] = [
  {
    id: "select",
    size: 56,
    enableSorting: false,
    // Dummy selection checkboxes for now (no row-selection behaviour yet).
    header: () => <input type="checkbox" class="align-middle" aria-label="Select all" />,
    cell: () => <input type="checkbox" class="align-middle" aria-label="Select row" />,
  },
  {
    id: "stocktakeNumber",
    accessorKey: "stocktakeNumber",
    header: "Number",
    size: 120,
  },
  {
    id: "status",
    header: "Status",
    size: 160,
    // Locked rows display as "On Hold" (mirrors the open-mSupply list view)...
    accessorFn: (row) => (row.isLocked ? "On Hold" : row.status),
    // ...but the status filter matches the underlying enum, not the display text.
    filterFn: (row, _columnId, filterValue) => !filterValue || row.original.status === filterValue,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    size: 420,
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
    size: 140,
    cell: (ctx) => formatDate(ctx.getValue<string>()),
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: () => <CommentIcon class="w-4 h-4 text-gray-muted" />,
    size: 60,
  },
];
