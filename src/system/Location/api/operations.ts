import { graphql, type ResultOf } from "../../../graphql/graphql";

export const LocationRowFragment = graphql(`
  fragment LocationRow on LocationNode {
    id
    name
    code
    onHold
    volume
    volumeUsed
    locationType { id name }
  }
`);
export type LocationRow = ResultOf<typeof LocationRowFragment>;

export const LocationsDocument = graphql(
  `
  query locations($storeId: String!, $filter: LocationFilterInput, $first: Int) {
    locations(storeId: $storeId, filter: $filter, page: { first: $first }, sort: { key: name, desc: false }) {
      ... on LocationConnector {
        totalCount
        nodes { ...LocationRow }
      }
    }
  }
`,
  [LocationRowFragment],
);
