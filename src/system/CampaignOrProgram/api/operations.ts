import { graphql, type ResultOf } from "../../../graphql/graphql";

export const CampaignRowFragment = graphql(`
  fragment CampaignRow on CampaignNode {
    id
    name
  }
`);
export type CampaignRow = ResultOf<typeof CampaignRowFragment>;

export const CampaignsDocument = graphql(
  `
    query campaigns($storeId: String!, $filter: CampaignFilterInput) {
      campaigns(storeId: $storeId, filter: $filter, sort: { key: name }) {
        ... on CampaignConnector {
          totalCount
          nodes {
            ...CampaignRow
          }
        }
      }
    }
  `,
  [CampaignRowFragment],
);

export const ProgramRowFragment = graphql(`
  fragment ProgramRow on ProgramNode {
    id
    name
  }
`);
export type ProgramRow = ResultOf<typeof ProgramRowFragment>;

export const ProgramsDocument = graphql(
  `
    query programs($storeId: String!, $filter: ProgramFilterInput) {
      programs(storeId: $storeId, filter: $filter, sort: { key: name, desc: false }) {
        ... on ProgramConnector {
          totalCount
          nodes {
            ...ProgramRow
          }
        }
      }
    }
  `,
  [ProgramRowFragment],
);
