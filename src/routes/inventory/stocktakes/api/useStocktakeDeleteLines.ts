import { useMutation, useQueryClient } from "@tanstack/solid-query";
import { useStocktakeApi } from "./useStocktakeApi";

/** Delete selected stocktake lines (by id) via the batch mutation. */
export const useStocktakeDeleteLines = (stocktakeId: () => string) => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (rows: { id: string }[]) =>
      api.saveLines({ insert: [], update: [], delete: rows.map((r) => ({ id: r.id })) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.keys.detail(stocktakeId()) }),
  }));
};
