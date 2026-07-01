import { readFragment } from "../../../../graphql/graphql";
import { request } from "../../../../graphql/client";
import { USE_MOCK } from "../../../../graphql/config";
import { mockStocktakeRows } from "../mockData";
import { StocktakeRowFragment, StocktakesDocument, type StocktakeRow } from "./operations";

/**
 * The query/mutation functions for the stocktake area, scoped to a store.
 * `get.*` are higher-order (return a thunk) so params can be captured for the
 * query key; direct mutations (update/delete/insert) will be added here later.
 */
export const getStocktakeQueries = (storeId: string) => ({
  get: {
    /** All stocktakes for the store (naive: no server-side filter/paging yet). */
    list: () => async (): Promise<StocktakeRow[]> => {
      if (USE_MOCK) return mockStocktakeRows();
      const data = await request(StocktakesDocument, { storeId });
      return [...readFragment(StocktakeRowFragment, data.stocktakes.nodes)];
    },
  },
  // future: update, deleteStocktakes, insertStocktake … (each `async` fn → a
  // useMutation hook that invalidates the relevant keys on success).
});

export type StocktakeQueries = ReturnType<typeof getStocktakeQueries>;
