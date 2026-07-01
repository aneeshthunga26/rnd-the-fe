import { keepPreviousData, useQuery } from "@tanstack/solid-query";
import type { StocktakeListParams } from "./operations";
import { useStocktakeApi } from "./useStocktakeApi";

/**
 * List query for the stocktakes screen. `params` is an accessor so page / sort /
 * filter changes re-key the query reactively; `keepPreviousData` keeps the old
 * page visible while the next one loads (no flash on page/filter change).
 */
export const useStocktakes = (params: () => StocktakeListParams) => {
  const api = useStocktakeApi();
  return useQuery(() => ({
    queryKey: api.keys.paramList(params()),
    queryFn: api.get.list(params()),
    placeholderData: keepPreviousData,
  }));
};
