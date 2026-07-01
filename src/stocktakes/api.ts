import { graphql, readFragment, type ResultOf } from "../graphql/graphql";
import { request } from "../graphql/client";
import { STORE_ID, USE_MOCK } from "../graphql/config";
import { mockStocktakeRows } from "./mockData";

// The row shape shown in the list. A fragment keeps the selected fields in one
// place; `StocktakeRow` is its inferred (unmasked) type.
export const StocktakeRowFragment = graphql(`
  fragment StocktakeRow on StocktakeNode {
    id
    stocktakeNumber
    status
    isLocked
    description
    createdDatetime
    comment
  }
`);

export type StocktakeRow = ResultOf<typeof StocktakeRowFragment>;

export const StocktakesDocument = graphql(
  `
  query stocktakes($storeId: String!) {
    stocktakes(storeId: $storeId) {
      ... on StocktakeConnector {
        totalCount
        nodes {
          ...StocktakeRow
        }
      }
    }
  }
`,
  [StocktakeRowFragment],
);

/** Fetch all stocktakes for the store (naive: no server-side filter/paging yet). */
export async function fetchStocktakes(): Promise<StocktakeRow[]> {
  if (USE_MOCK) return mockStocktakeRows();
  const data = await request(StocktakesDocument, { storeId: STORE_ID });
  return [...readFragment(StocktakeRowFragment, data.stocktakes.nodes)];
}
