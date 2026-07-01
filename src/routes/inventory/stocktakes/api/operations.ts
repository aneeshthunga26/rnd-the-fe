import { graphql, type ResultOf, type VariablesOf } from "../../../../graphql/graphql";

// GraphQL contract for the stocktake list. A fragment keeps the selected fields
// in one place; `StocktakeRow` is its inferred (unmasked) type.
export const StocktakeRowFragment = graphql(`
  fragment StocktakeRow on StocktakeNode {
    id
    stocktakeNumber
    status
    isLocked
    description
    comment
    createdDatetime
    finalisedDatetime
    stocktakeDate
  }
`);

export type StocktakeRow = ResultOf<typeof StocktakeRowFragment>;

// Server-side list: filter / sort / pagination all go to the server (mirrors the
// open-mSupply `stocktakes` operation). The connector returns a `totalCount` used
// to drive server pagination.
export const StocktakesDocument = graphql(
  `
    query stocktakes(
      $storeId: String!
      $filter: StocktakeFilterInput
      $page: PaginationInput
      $sort: [StocktakeSortInput!]
    ) {
      stocktakes(storeId: $storeId, filter: $filter, page: $page, sort: $sort) {
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

// Delete stocktakes via the batch mutation. `DeleteStocktakeInput = { id: String! }`.
export const DeleteStocktakesDocument = graphql(`
  mutation deleteStocktakes($storeId: String!, $ids: [DeleteStocktakeInput!]) {
    batchStocktake(storeId: $storeId, input: { deleteStocktakes: $ids }) {
      deleteStocktakes {
        id
      }
    }
  }
`);

// Sortable keys accepted by `StocktakeSortFieldInput`.
export type StocktakeSortKey =
  | "stocktakeNumber"
  | "status"
  | "description"
  | "comment"
  | "createdDatetime"
  | "finalisedDatetime"
  | "stocktakeDate";

// Filter shape sent to the server. Keys mirror `StocktakeFilterInput`; only the
// slice the list screen uses is typed here (extend as filters are added).
export interface StocktakeFilter {
  status?: { equalTo?: "NEW" | "FINALISED" };
  createdDatetime?: { afterOrEqualTo?: string; beforeOrEqualTo?: string; equalTo?: string };
  description?: { like?: string; equalTo?: string };
  comment?: { like?: string; equalTo?: string };
  isLocked?: boolean;
}

// The params captured by the list query key and turned into query variables.
export interface StocktakeListParams {
  first: number;
  offset: number;
  sortBy?: { key: StocktakeSortKey; desc: boolean };
  filterBy?: StocktakeFilter;
}

// ── Detail view ────────────────────────────────────────────────────────────────

// The stocktake document (header/side-panel fields). `lines { totalCount }` is
// used only as an existence/count check — lines are fetched separately.
export const StocktakeDetailFragment = graphql(`
  fragment StocktakeDetail on StocktakeNode {
    id
    stocktakeNumber
    comment
    description
    createdDatetime
    finalisedDatetime
    status
    isLocked
    countedBy
    verifiedBy
    isInitialStocktake
    user {
      username
      email
    }
    lines {
      totalCount
    }
  }
`);
export type StocktakeDetail = ResultOf<typeof StocktakeDetailFragment>;

export const StocktakeDocument = graphql(
  `
    query stocktake($stocktakeId: String!, $storeId: String!) {
      stocktake(id: $stocktakeId, storeId: $storeId) {
        __typename
        ... on StocktakeNode {
          ...StocktakeDetail
        }
      }
    }
  `,
  [StocktakeDetailFragment],
);

// Full stocktake-line selection (references $storeId for manufacturer + item props).
export const StocktakeLineFragment = graphql(`
  fragment StocktakeLine on StocktakeLineNode {
    id
    stocktakeId
    itemId
    itemName
    batch
    expiryDate
    manufactureDate
    packSize
    snapshotNumberOfPacks
    countedNumberOfPacks
    sellPricePerPack
    costPricePerPack
    comment
    volumePerPack
    donorId
    donorName
    itemVariantId
    item {
      id
      code
      name
      unitName
      isVaccine
      doses
      defaultPackSize
      restrictedLocationTypeId
      itemStoreProperties(storeId: $storeId) {
        defaultSellPricePerPack
      }
    }
    location {
      id
      name
      code
      onHold
      locationType {
        id
        name
      }
    }
    stockLine {
      id
    }
    reasonOption {
      id
      reason
      type
      isActive
    }
    vvmStatus {
      id
      description
      priority
      reasonId
      unusable
    }
    manufacturer(storeId: $storeId) {
      id
      name
      code
    }
    itemVariant {
      id
      packagingVariants {
        id
        packSize
        volumePerUnit
      }
    }
    campaign {
      id
      name
    }
    program {
      id
      name
    }
  }
`);
export type StocktakeLine = ResultOf<typeof StocktakeLineFragment>;

export const StocktakeLinesDocument = graphql(
  `
    query stocktakeLines(
      $stocktakeId: String!
      $storeId: String!
      $page: PaginationInput
      $sort: [StocktakeLineSortInput!]
      $filter: StocktakeLineFilterInput
    ) {
      stocktakeLines(
        stocktakeId: $stocktakeId
        storeId: $storeId
        page: $page
        sort: $sort
        filter: $filter
      ) {
        ... on StocktakeLineConnector {
          totalCount
          nodes {
            ...StocktakeLine
          }
        }
      }
    }
  `,
  [StocktakeLineFragment],
);

// Update the document (comment / description / countedBy / verifiedBy / isLocked / status).
export const UpdateStocktakeDocument = graphql(`
  mutation updateStocktake($storeId: String!, $input: UpdateStocktakeInput!) {
    updateStocktake(storeId: $storeId, input: $input) {
      __typename
      ... on StocktakeNode {
        id
      }
      ... on UpdateStocktakeError {
        error {
          __typename
          description
          ... on SnapshotCountCurrentCountMismatch {
            lines {
              stocktakeLine {
                id
                itemName
                batch
                item {
                  code
                }
              }
            }
          }
          ... on StockLinesReducedBelowZero {
            errors {
              stockLine {
                id
                itemName
                batch
                item {
                  code
                }
              }
            }
          }
        }
      }
    }
  }
`);

export type StocktakeLineSortKey =
  | "itemCode"
  | "itemName"
  | "batch"
  | "expiryDate"
  | "packSize"
  | "locationCode"
  | "snapshotNumberOfPacks"
  | "countedNumberOfPacks"
  | "reasonOption";

export interface StocktakeLineFilter {
  itemId?: { equalTo?: string };
  itemCodeOrName?: { like?: string };
}

export interface StocktakeLineListParams {
  first?: number;
  offset?: number;
  sortBy?: { key: StocktakeLineSortKey; desc: boolean };
  filterBy?: StocktakeLineFilter;
}

// The patch shape for a document update (id required, all else optional).
export interface UpdateStocktakePatch {
  id: string;
  comment?: string;
  description?: string;
  countedBy?: string;
  verifiedBy?: string;
  isLocked?: boolean;
  status?: "FINALISED";
}

// ── Create ─────────────────────────────────────────────────────────────────────

export const InsertStocktakeDocument = graphql(`
  mutation insertStocktake($storeId: String!, $input: InsertStocktakeInput!) {
    insertStocktake(storeId: $storeId, input: $input) {
      __typename
      ... on StocktakeNode {
        id
        stocktakeNumber
      }
    }
  }
`);

// Estimated-lines counts for the create modal (only totalCount is consumed).
export const StockLinesCountDocument = graphql(`
  query stockLinesCount($storeId: String!, $filter: StockLineFilterInput) {
    stockLines(storeId: $storeId, filter: $filter) {
      __typename
      ... on StockLineConnector {
        totalCount
      }
    }
  }
`);

export const ItemsCountDocument = graphql(`
  query itemsCount($storeId: String!, $filter: ItemFilterInput) {
    items(storeId: $storeId, filter: $filter, page: { first: 1 }) {
      __typename
      ... on ItemConnector {
        totalCount
      }
    }
  }
`);

// The create-modal input (id generated in the api layer).
export type CreateStocktakeInput = Omit<
  NonNullable<VariablesOf<typeof InsertStocktakeDocument>["input"]>,
  "id"
>;

// ── Line edit (09) ───────────────────────────────────────────────────────────

// Stock lines for an item — used to seed uncounted draft rows in the line editor.
export const StockLineForStocktakeFragment = graphql(`
  fragment StockLineForStocktake on StockLineNode {
    id
    itemId
    batch
    packSize
    expiryDate
    manufactureDate
    sellPricePerPack
    costPricePerPack
    totalNumberOfPacks
    availableNumberOfPacks
    volumePerPack
    itemVariantId
    onHold
    note
    location {
      id
      name
      code
      onHold
      locationType {
        id
        name
      }
    }
    item {
      id
      code
      name
      unitName
      isVaccine
      doses
      defaultPackSize
      restrictedLocationTypeId
    }
    donor(storeId: $storeId) {
      id
      name
    }
    vvmStatus {
      id
      description
      priority
      reasonId
      unusable
    }
    campaign {
      id
      name
    }
    program {
      id
      name
    }
  }
`);
export type StockLineForStocktake = ResultOf<typeof StockLineForStocktakeFragment>;

export const StockLinesByItemDocument = graphql(
  `
    query stockLinesByItem($storeId: String!, $itemId: String!) {
      stockLines(storeId: $storeId, filter: { itemId: { equalTo: $itemId }, isActive: true }) {
        ... on StockLineConnector {
          totalCount
          nodes {
            ...StockLineForStocktake
          }
        }
      }
    }
  `,
  [StockLineForStocktakeFragment],
);

// Batch insert/update/delete of stocktake lines. Per-line responses carry either
// a StocktakeLineNode (success) or a typed error.
export const UpsertStocktakeLinesDocument = graphql(`
  mutation upsertStocktakeLines(
    $storeId: String!
    $insert: [InsertStocktakeLineInput!]
    $update: [UpdateStocktakeLineInput!]
    $delete: [DeleteStocktakeLineInput!]
  ) {
    batchStocktake(
      storeId: $storeId
      input: { insertStocktakeLines: $insert, updateStocktakeLines: $update, deleteStocktakeLines: $delete }
    ) {
      insertStocktakeLines {
        id
        response {
          __typename
          ... on InsertStocktakeLineError {
            error {
              __typename
              description
              ... on StockLineReducedBelowZero {
                stockLine {
                  id
                  itemName
                  batch
                  item {
                    code
                  }
                }
              }
            }
          }
        }
      }
      updateStocktakeLines {
        id
        response {
          __typename
          ... on UpdateStocktakeLineError {
            error {
              __typename
              description
              ... on StockLineReducedBelowZero {
                stockLine {
                  id
                  itemName
                  batch
                  item {
                    code
                  }
                }
              }
              ... on SnapshotCountCurrentCountMismatchLine {
                stocktakeLine {
                  id
                  itemName
                  batch
                  item {
                    code
                  }
                }
              }
            }
          }
        }
      }
      deleteStocktakeLines {
        id
        response {
          __typename
        }
      }
    }
  }
`);

// Nullable-update wrapper shapes (for update input fields).
export type NullableStringUpdate = { value: string | null } | undefined;
export type NullableDateUpdate = { value: string | null } | undefined;
