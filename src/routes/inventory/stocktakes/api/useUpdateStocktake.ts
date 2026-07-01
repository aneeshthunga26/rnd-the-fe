import { useMutation, useQueryClient } from "@tanstack/solid-query";
import type { UpdateStocktakePatch } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/**
 * Update the stocktake document. Broadly invalidates `base()` on success so the
 * document + lines refetch (mirrors open-mSupply). Returns the raw union result
 * so callers can branch on `__typename` for the finalise error flow.
 */
export const useUpdateStocktake = () => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (patch: UpdateStocktakePatch) => api.update(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.keys.base() }),
  }));
};
