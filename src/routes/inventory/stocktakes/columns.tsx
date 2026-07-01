import { type Accessor, createMemo } from "solid-js";
import type { ColumnDef } from "@tanstack/solid-table";
import type { StocktakeRow } from "./api";
import { CommentIcon } from "../../../components/icons";
import { selectionColumn } from "../../../components/table/selectionColumn";
import { useFormat, useI18n } from "../../../intl";

// Reactive locale-aware column definitions for the stocktakes list. Every column
// has an explicit `id` (accessorFn columns require it; column state —
// visibility/sort — is keyed by id). Sortable column ids match
// `StocktakeSortFieldInput` keys (server sorts).
export const useStocktakeColumns = (): Accessor<ColumnDef<StocktakeRow>[]> => {
  const { t } = useI18n();
  const fmt = useFormat();
  // Memoised so the array reference is stable across unrelated reactive reads
  // (preserving TanStack column memoization + reference-keyed <For> identity);
  // it recomputes only when the locale changes (the header t() calls track it).
  return createMemo(() => [
    selectionColumn<StocktakeRow>(),
    {
      id: "stocktakeNumber",
      accessorKey: "stocktakeNumber",
      header: t("label.number"),
      size: 120,
    },
    {
      id: "status",
      header: t("label.status"),
      size: 160,
      // Locked rows display as "On Hold" (mirrors the open-mSupply list view).
      accessorFn: (row) => (row.isLocked ? t("status.on-hold") : row.status),
    },
    {
      id: "description",
      accessorKey: "description",
      header: t("label.description"),
      size: 420,
    },
    {
      id: "createdDatetime",
      accessorKey: "createdDatetime",
      header: t("label.created"),
      size: 140,
      cell: (ctx) => fmt().formatDate(ctx.getValue<string>()),
    },
    {
      id: "comment",
      accessorKey: "comment",
      header: () => <CommentIcon class="w-4 h-4 text-muted" />,
      size: 60,
      enableSorting: false,
    },
  ]);
};
