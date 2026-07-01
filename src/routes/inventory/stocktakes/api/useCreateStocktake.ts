import { useMutation, useQueryClient } from "@tanstack/solid-query";
import type { CreateStocktakeInput } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/** Create-stocktake mutation. Invalidates the list on success; resolves to the new id. */
export const useCreateStocktake = () => {
  const api = useStocktakeApi();
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (input: CreateStocktakeInput) => api.insertStocktake(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.keys.base() }),
  }));
};
