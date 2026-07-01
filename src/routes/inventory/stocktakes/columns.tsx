import type { ColumnDef } from "@tanstack/solid-table";
import type { StocktakeRow } from "./api";
import { CommentIcon } from "../../../components/icons";
import { selectionColumn } from "../../../components/table/selectionColumn";

// dd/mm/yyyy to mirror the reference UI (display-only formatting).
export const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
};

// Column definitions for the stocktakes list. Every column has an explicit `id`
// (accessorFn columns require it; column state — visibility/sort — is keyed by id).
// Column ids that are sortable match `StocktakeSortFieldInput` keys (server sorts).
export const columns: ColumnDef<StocktakeRow>[] = [
  selectionColumn<StocktakeRow>(),
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
    // Locked rows display as "On Hold" (mirrors the open-mSupply list view).
    accessorFn: (row) => (row.isLocked ? "On Hold" : row.status),
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    size: 420,
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
    enableSorting: false,
  },
];
