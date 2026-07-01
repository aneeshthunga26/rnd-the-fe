import { useQuery } from "@tanstack/solid-query";
import { useStocktakeApi } from "./useStocktakeApi";

/** List query for the stocktakes screen. */
export const useStocktakes = () => {
  const api = useStocktakeApi();
  return useQuery(() => ({
    queryKey: api.keys.list(),
    queryFn: api.get.list(),
  }));
};
