import { graphql, type ResultOf } from "../../../../graphql/graphql";

// GraphQL contract for the stocktake list. A fragment keeps the selected fields
// in one place; `StocktakeRow` is its inferred (unmasked) type.
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
