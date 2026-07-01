import { useMutation, useQueryClient } from "@tanstack/solid-query";
import type { UpdateStocktakePatch } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/**
 * Update the stocktake document. A field/status edit only affects that
 * stocktake's detail and the lists, so we invalidate `detail(id)` + `list()`
 * rather than the whole `base()` cache. Returns the raw union result so callers
 * can branch on `__typename` for the finalise error flow.
 */
export const useUpdateStocktake = () => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (patch: UpdateStocktakePatch) => api.update(patch),
    onSuccess: (_result, patch) => {
      queryClient.invalidateQueries({ queryKey: api.keys.detail(patch.id) });
      queryClient.invalidateQueries({ queryKey: api.keys.list() });
    },
  }));
};
