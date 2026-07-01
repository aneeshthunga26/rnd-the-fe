import { graphql, type ResultOf } from "../../../graphql/graphql";

// ── MasterList ────────────────────────────────────────────────────────────────
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

// ── Location ────────────────────────────────────────────────────────────────
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
  query locations($storeId: String!, $filter: LocationFilterInput) {
    locations(storeId: $storeId, filter: $filter, sort: { key: name, desc: false }) {
      ... on LocationConnector {
        totalCount
        nodes { ...LocationRow }
      }
    }
  }
`,
  [LocationRowFragment],
);

// ── VVM status ────────────────────────────────────────────────────────────────
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
        nodes { ...VvmStatus }
      }
    }
  }
`,
  [VvmStatusFragment],
);

// ── Reason options ────────────────────────────────────────────────────────────
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
        nodes { ...ReasonOptionRow }
      }
    }
  }
`,
  [ReasonOptionRowFragment],
);

// ── Stock item ────────────────────────────────────────────────────────────────
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

// ── Names (donor / manufacturer) ────────────────────────────────────────────────
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
        nodes { ...NameRow }
      }
    }
  }
`,
  [NameRowFragment],
);

// ── Campaigns & programs ────────────────────────────────────────────────────────
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
        nodes { ...CampaignRow }
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
        nodes { ...ProgramRow }
      }
    }
  }
`,
  [ProgramRowFragment],
);

// ── Preferences ──────────────────────────────────────────────────────────────
export const PreferencesDocument = graphql(`
  query preferences($storeId: String!) {
    preferences(storeId: $storeId) {
      allowTrackingOfStockByDonor
      manageVaccinesInDoses
      manageVvmStatusForStock
      sortByVvmStatusThenExpiry
    }
  }
`);
export type PreferencesResult = ResultOf<typeof PreferencesDocument>["preferences"];
