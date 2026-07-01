import { STORE_ID } from "../../../../graphql/config";
import { getStocktakeQueries } from "./api";
import { makeStocktakeKeys } from "./keys";

/**
 * The single place that wires storeId + query fns + keys together. Query and
 * mutation hooks build on this. When multi-store lands, read `storeId` from a
 * store context here instead of the config constant — nothing else changes.
 */
export const useStocktakeApi = () => {
  const storeId = STORE_ID;
  return {
    ...getStocktakeQueries(storeId),
    storeId,
    keys: makeStocktakeKeys(storeId),
  };
};
