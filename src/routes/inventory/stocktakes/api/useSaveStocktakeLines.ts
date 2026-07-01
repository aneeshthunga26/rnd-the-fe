import { useMutation, useQueryClient } from "@tanstack/solid-query";
import {
  stocktakeLineErrorMessage,
  type StocktakeLineError,
  useStocktakeLineError,
} from "../../../../context/stocktakeLineError";
import type { DraftStocktakeLine } from "../DetailView/modal/draft";
import { partitionDraftLines } from "../DetailView/modal/transforms";
import { useStocktakeApi } from "./useStocktakeApi";

interface LineErrorLike {
  __typename: string;
  description?: string;
  stockLine?: { id: string; itemName?: string | null; batch?: string | null; item?: { code: string } } | null;
  stocktakeLine?: { id: string; itemName?: string | null; batch?: string | null; item?: { code: string } } | null;
}

const toLineError = (error: LineErrorLike): StocktakeLineError => {
  const detail = error.stockLine ?? error.stocktakeLine ?? undefined;
  return {
    __typename: error.__typename,
    description: error.description,
    itemCode: detail?.item?.code ?? null,
    itemName: detail?.itemName ?? null,
    batch: detail?.batch ?? null,
  };
};

export interface SaveLinesResult {
  errorMessages?: string[];
}

/**
 * Saves draft lines via `batchStocktake` (insert/update/delete) and maps per-line
 * structured errors into the line-error context. Returns any distinct error
 * messages (deduped by typename) for a toast/banner. Shared by 09 and 10.
 */
export const useSaveStocktakeLines = (stocktakeId: () => string) => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  const errors = useStocktakeLineError();

  const mutation = useMutation(() => ({
    mutationFn: (drafts: DraftStocktakeLine[]) => api.saveLines(partitionDraftLines(drafts)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.keys.detail(stocktakeId()) }),
  }));

  const save = async (drafts: DraftStocktakeLine[]): Promise<SaveLinesResult> => {
    let result: Awaited<ReturnType<typeof api.saveLines>>;
    try {
      result = await mutation.mutateAsync(drafts);
    } catch (e) {
      return { errorMessages: [e instanceof Error ? e.message : String(e)] };
    }

    errors.unsetAll();
    const messagesByType: Record<string, string> = {};
    const results = [...(result.insertStocktakeLines ?? []), ...(result.updateStocktakeLines ?? [])];

    for (const r of results) {
      const resp = r.response;
      if (resp.__typename === "StocktakeLineNode") continue;
      const error = resp.error as LineErrorLike;
      if (error.__typename === "CannotEditStocktake") {
        messagesByType[error.__typename] = stocktakeLineErrorMessage(error.__typename);
        continue;
      }
      errors.setError(r.id, toLineError(error));
      messagesByType[error.__typename] = stocktakeLineErrorMessage(error.__typename);
    }

    const errorMessages = Object.values(messagesByType);
    return { errorMessages: errorMessages.length ? errorMessages : undefined };
  };

  return { save, isSaving: () => mutation.isPending };
};
