import { graphql, type ResultOf } from "../../../graphql/graphql";

export const VvmStatusFragment = graphql(`
  fragment VvmStatus on VvmstatusNode {
    id
    description
    priority
    unusable
    reasonId
  }
`);
export type VvmStatusRow = ResultOf<typeof VvmStatusFragment>;

export const ActiveVvmStatusesDocument = graphql(
  `
    query activeVvmStatuses($storeId: String!) {
      activeVvmStatuses(storeId: $storeId) {
        ... on VvmstatusConnector {
          nodes {
            ...VvmStatus
          }
        }
      }
    }
  `,
  [VvmStatusFragment],
);
