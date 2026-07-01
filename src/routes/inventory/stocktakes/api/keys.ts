// Query-key factory, scoped by storeId so caches don't collide across stores.
// Keys are prefix-composed to allow broad invalidation (invalidate `base()` to
// clear everything, or `detail(id)` to clear one stocktake).
export const makeStocktakeKeys = (storeId: string) => {
  const keys = {
    base: () => ["stocktake"] as const,
    list: () => [...keys.base(), storeId, "list"] as const,
    paramList: (params: unknown) => [...keys.list(), params] as const,
    detail: (id: string) => [...keys.base(), storeId, id] as const,
  };
  return keys;
};

export type StocktakeKeys = ReturnType<typeof makeStocktakeKeys>;
