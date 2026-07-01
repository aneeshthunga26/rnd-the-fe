import { graphql, type ResultOf } from "../../../graphql/graphql";

export const MasterListRowFragment = graphql(`
  fragment MasterListRow on MasterListNode {
    id
    name
    code
    description
    linesCount
  }
`);
export type MasterListRow = ResultOf<typeof MasterListRowFragment>;

export const MasterListsDocument = graphql(
  `
  query masterLists($storeId: String!, $filter: MasterListFilterInput) {
    masterLists(storeId: $storeId, filter: $filter, sort: { key: name }) {
      ... on MasterListConnector {
        totalCount
        nodes { ...MasterListRow }
      }
    }
  }
`,
  [MasterListRowFragment],
);
