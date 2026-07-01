import { keepPreviousData, useQuery } from "@tanstack/solid-query";
import type { StocktakeLineListParams } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/** Fetch the lines for a stocktake (accessors for reactivity). */
export const useStocktakeLines = (id: () => string, params: () => StocktakeLineListParams) => {
  const api = useStocktakeApi();
  return useQuery(() => ({
    queryKey: api.keys.lines(id(), params()),
    queryFn: api.get.lines(id(), params()),
    get enabled() {
      return !!id();
    },
    placeholderData: keepPreviousData,
  }));
};
