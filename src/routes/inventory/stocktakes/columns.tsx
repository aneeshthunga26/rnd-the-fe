import { type Accessor, createMemo, Show } from "solid-js";
import type { ColumnDef } from "@tanstack/solid-table";
import type { StocktakeRow } from "./api";
import { CommentIcon } from "../../../components/icons";
import { Tooltip } from "../../../components/ui/Tooltip";
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
  const columns = createMemo(() => [
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
      // Show the same icon as the header (only when a comment exists); hover or
      // click reveals the comment text in a tooltip. stopPropagation keeps the
      // trigger from also firing the row's navigate-to-detail click.
      cell: (ctx) => {
        const comment = ctx.getValue<string | null | undefined>();
        return (
          <Show when={comment}>
            <span onClick={(e) => e.stopPropagation()}>
              <Tooltip content={comment}>
                <CommentIcon class="w-4 h-4 text-muted" />
              </Tooltip>
            </span>
          </Show>
        );
      },
    },
  ]);
  return columns;
};
