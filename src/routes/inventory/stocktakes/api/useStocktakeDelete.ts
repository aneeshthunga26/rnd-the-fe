import { useMutation, useQueryClient } from "@tanstack/solid-query";
import type { StocktakeRow } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/**
 * A stocktake is deletable only when it is NEW and not locked
 * (mirrors open-mSupply's `canDeleteStocktake`).
 */
export const canDeleteStocktake = (row: Pick<StocktakeRow, "status" | "isLocked">) =>
  row.status === "NEW" && !row.isLocked;

/** Delete-stocktakes mutation. Invalidates the lists on success. */
export const useStocktakeDelete = () => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (rows: Pick<StocktakeRow, "id">[]) => api.deleteStocktakes(rows),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.keys.list() }),
  }));
};
