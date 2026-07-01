import { graphql, type ResultOf } from "../../../graphql/graphql";

export const ItemStockOnHandFragment = graphql(`
  fragment ItemStockOnHand on ItemNode {
    id
    code
    name
    unitName
    isVaccine
    doses
    defaultPackSize
    restrictedLocationTypeId
    itemStoreProperties(storeId: $storeId) { defaultSellPricePerPack }
  }
`);
export type ItemStockOnHandRow = ResultOf<typeof ItemStockOnHandFragment>;

export const ItemsDocument = graphql(
  `
  query items($storeId: String!, $filter: ItemFilterInput, $first: Int) {
    items(storeId: $storeId, filter: $filter, page: { first: $first }, sort: { key: name, desc: false }) {
      ... on ItemConnector {
        totalCount
        nodes { ...ItemStockOnHand }
      }
    }
  }
`,
  [ItemStockOnHandFragment],
);
