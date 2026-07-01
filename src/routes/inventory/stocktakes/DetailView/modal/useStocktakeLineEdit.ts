import { createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { useQuery } from "@tanstack/solid-query";
import { useSaveStocktakeLines } from "../../api/useSaveStocktakeLines";
import { useStocktakeApi, type StocktakeLine } from "../../api";
import { DraftLine, type DraftItem, type DraftStocktakeLine } from "./draft";

export interface LineEditController {
  draftLines: DraftStocktakeLine[];
  update: (patch: Partial<DraftStocktakeLine> & { id: string }) => void;
  addLine: (patch?: Partial<DraftStocktakeLine>) => void;
  save: () => Promise<{ errorMessages?: string[] }>;
  isSaving: () => boolean;
  isLoading: () => boolean;
}

/**
 * Builds and manages the draft lines for one item: existing counted lines +
 * uncounted stock lines, editable in a Solid store. Rebuilds when the item or
 * server data changes; persists via `batchStocktake`.
 */
export function useStocktakeLineEdit(params: {
  stocktakeId: () => string;
  item: () => DraftItem | null;
  existingLines: () => StocktakeLine[];
}): LineEditController {
  const api = useStocktakeApi();
  const { save: saveLines, isSaving } = useSaveStocktakeLines(params.stocktakeId);
  const [draftLines, setDraftLines] = createStore<DraftStocktakeLine[]>([]);

  const stockQuery = useQuery(() => ({
    queryKey: ["stockLinesByItem", api.storeId, params.item()?.id ?? ""],
    queryFn: api.get.stockLinesByItem(params.item()?.id ?? ""),
    get enabled() {
      return !!params.item()?.id;
    },
  }));

  // Rebuild drafts when item / stock lines / existing lines change.
  createEffect(() => {
    const item = params.item();
    if (!item) {
      setDraftLines(reconcile([], { key: "id" }));
      return;
    }
    const itemLines = params.existingLines().filter((l) => l.item.id === item.id);
    const stockLines = stockQuery.data ?? [];
    const fromStockLines = stockLines
      .filter((sl) => !itemLines.some((l) => l.stockLine?.id === sl.id))
      .map((sl) => DraftLine.fromStockLine(params.stocktakeId(), sl, itemLines.length === 0));
    const fromStocktake = itemLines.map((l) => DraftLine.fromStocktakeLine(params.stocktakeId(), l));
    setDraftLines(reconcile([...fromStockLines, ...fromStocktake], { key: "id" }));
  });

  const update: LineEditController["update"] = (patch) => {
    setDraftLines(
      (line) => line.id === patch.id,
      (prev) => ({ ...prev, ...patch, isUpdated: !patch.isCreated }),
    );
  };

  const addLine: LineEditController["addLine"] = (patch) => {
    const item = params.item();
    if (!item) return;
    const line = { ...DraftLine.fromItem(params.stocktakeId(), item), ...patch };
    setDraftLines(reconcile([line, ...draftLines], { key: "id" }));
  };

  return {
    draftLines,
    update,
    addLine,
    save: () => saveLines(draftLines),
    isSaving,
    isLoading: () => stockQuery.isLoading,
  };
}
