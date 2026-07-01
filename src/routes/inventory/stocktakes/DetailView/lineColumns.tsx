import { type Accessor, createMemo } from "solid-js";
import type { ColumnDef } from "@tanstack/solid-table";
import { selectionColumn } from "../../../../components/table/selectionColumn";
import { usePreferences } from "../../../../preferences";
import { useStocktakeLineError } from "../../../../context/stocktakeLineError";
import { useFormat, useI18n } from "../../../../intl";
import type { StocktakeLine } from "../api";

const num = (v: unknown) => (v == null ? "" : String(v));

/** doses = counted × packSize × doses/unit (vaccines only; null when uncounted). */
export const dosesCounted = (line: StocktakeLine): number | null => {
  if (!line.item.isVaccine) return null;
  const counted = line.countedNumberOfPacks;
  if (counted == null) return null;
  return counted * (line.packSize || line.item.defaultPackSize || 1) * (line.item.doses ?? 1);
};

/** difference = (counted ?? snapshot) − snapshot (0 for uncounted lines). */
export const difference = (line: StocktakeLine): number =>
  (line.countedNumberOfPacks ?? line.snapshotNumberOfPacks) - line.snapshotNumberOfPacks;

/** A line is "uncounted" (placeholder) when its counted packs is null. */
export const isUncounted = (line: StocktakeLine): boolean => line.countedNumberOfPacks == null;

/**
 * The lines-table columns. Reactive (accessor) so preference-gated columns appear
 * once prefs resolve. Reads the line-error context for cell highlighting.
 * Sortable column ids match `StocktakeLineSortFieldInput` keys (server sorts).
 */
export const useLineColumns = (): Accessor<ColumnDef<StocktakeLine>[]> => {
  const { t } = useI18n();
  const fmt = useFormat();
  const prefs = usePreferences();
  const { getError } = useStocktakeLineError();

  // A cell that highlights (danger border) when the line has a matching error.
  const errorCell =
    (match?: string) =>
    (ctx: { row: { original: StocktakeLine }; getValue: () => unknown }) => {
      const err = getError({ id: ctx.row.original.id });
      const highlight = err && (match ? err.__typename === match : true);
      return (
        <span classList={{ "rounded border border-danger px-1": !!highlight }}>
          {num(ctx.getValue())}
        </span>
      );
    };

  // Memoised so the array reference stays stable across unrelated reactive reads
  // (the lines table is virtualized — churning column identity would defeat that);
  // recomputes only when prefs (gated columns) or locale (header t()) change.
  return createMemo(() => {
    const cols: ColumnDef<StocktakeLine>[] = [
      selectionColumn<StocktakeLine>(),
      {
        id: "itemCode",
        accessorFn: (r) => r.item.code,
        header: t("label.code"),
        size: 120,
        cell: errorCell(),
      },
      { id: "itemName", accessorKey: "itemName", header: t("label.name"), size: 320 },
      { id: "batch", accessorKey: "batch", header: t("label.batch"), size: 110 },
      {
        id: "expiryDate",
        accessorFn: (r) => r.expiryDate,
        header: t("label.expiry"),
        size: 110,
        cell: (ctx) => fmt().formatDate(ctx.getValue<string | null>()),
      },
      {
        id: "manufactureDate",
        accessorFn: (r) => r.manufactureDate,
        header: t("label.manufactured"),
        size: 120,
        enableSorting: false,
        cell: (ctx) => fmt().formatDate(ctx.getValue<string | null>()),
      },
      {
        id: "locationCode",
        accessorFn: (r) => r.location?.code ?? "",
        header: t("label.location"),
        size: 100,
        enableSorting: false,
      },
      {
        id: "itemUnit",
        accessorFn: (r) => r.item.unitName ?? "",
        header: t("label.unit"),
        size: 90,
        enableSorting: false,
      },
      { id: "packSize", accessorKey: "packSize", header: t("label.pack-size"), size: 90, enableSorting: false },
    ];

    if (prefs().manageVaccinesInDoses) {
      cols.push({
        id: "itemDoses",
        accessorFn: (r) => (r.item.isVaccine ? r.item.doses : undefined),
        header: t("label.doses-per-unit"),
        size: 110,
        enableSorting: false,
        cell: (ctx) => num(ctx.getValue()),
      });
    }

    cols.push(
      {
        id: "snapshotNumberOfPacks",
        accessorKey: "snapshotNumberOfPacks",
        header: t("label.snapshot"),
        size: 100,
        cell: errorCell("SnapshotCountCurrentCountMismatchLine"),
      },
      {
        id: "countedNumberOfPacks",
        accessorKey: "countedNumberOfPacks",
        header: t("label.counted"),
        size: 100,
        cell: errorCell("StockLineReducedBelowZero"),
      },
    );

    if (prefs().manageVaccinesInDoses) {
      cols.push({
        id: "dosesCounted",
        accessorFn: (r) => dosesCounted(r),
        header: t("label.doses-counted"),
        size: 110,
        enableSorting: false,
        cell: (ctx) => num(ctx.getValue()),
      });
    }

    cols.push(
      {
        id: "difference",
        accessorFn: (r) => difference(r),
        header: t("label.difference"),
        size: 100,
        enableSorting: false,
        cell: (ctx) => num(ctx.getValue()),
      },
      {
        id: "reasonOption",
        accessorFn: (r) => r.reasonOption?.reason ?? "",
        header: t("label.reason"),
        size: 140,
      },
    );

    if (prefs().allowTrackingOfStockByDonor) {
      cols.push({
        id: "donor",
        accessorFn: (r) => r.donorName ?? "",
        header: t("label.donor"),
        size: 140,
        enableSorting: false,
      });
    }

    cols.push(
      {
        id: "manufacturer",
        accessorFn: (r) => r.manufacturer?.name ?? "",
        header: t("label.manufacturer"),
        size: 140,
        enableSorting: false,
      },
      { id: "comment", accessorKey: "comment", header: t("label.comment"), size: 160, enableSorting: false },
    );

    return cols;
  });
};
