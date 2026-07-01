import { graphql, type ResultOf } from "../../../graphql/graphql";

export const ReasonOptionRowFragment = graphql(`
  fragment ReasonOptionRow on ReasonOptionNode {
    id
    type
    reason
    isActive
  }
`);
export type ReasonOptionRow = ResultOf<typeof ReasonOptionRowFragment>;

export const ReasonOptionsDocument = graphql(
  `
    query reasonOptions($filter: ReasonOptionFilterInput) {
      reasonOptions(filter: $filter, sort: { key: reason }) {
        ... on ReasonOptionConnector {
          totalCount
          nodes {
            ...ReasonOptionRow
          }
        }
      }
    }
  `,
  [ReasonOptionRowFragment],
);
