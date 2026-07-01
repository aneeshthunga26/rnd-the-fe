import { useQuery } from "@tanstack/solid-query";
import { useStocktakeApi } from "./useStocktakeApi";

/** Fetch a single stocktake document by id (accessor for reactivity). */
export const useStocktake = (id: () => string) => {
  const api = useStocktakeApi();
  return useQuery(() => ({
    queryKey: api.keys.detail(id()),
    queryFn: api.get.byId(id()),
    get enabled() {
      return !!id();
    },
    refetchOnMount: false,
    gcTime: 0,
  }));
};
