import { graphql, type ResultOf } from "../../../graphql/graphql";

export const NameRowFragment = graphql(`
  fragment NameRow on NameNode {
    id
    name
    code
    isOnHold
  }
`);
export type NameRow = ResultOf<typeof NameRowFragment>;

export const NamesDocument = graphql(
  `
    query names($storeId: String!, $filter: NameFilterInput, $first: Int) {
      names(storeId: $storeId, filter: $filter, page: { first: $first }, sort: { key: name, desc: false }) {
        ... on NameConnector {
          totalCount
          nodes {
            ...NameRow
          }
        }
      }
    }
  `,
  [NameRowFragment],
);
