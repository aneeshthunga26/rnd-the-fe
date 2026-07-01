import { readFragment } from "../../../../graphql/graphql";
import { request } from "../../../../graphql/client";
import {
  type CreateStocktakeInput,
  DeleteStocktakesDocument,
  InsertStocktakeDocument,
  ItemsCountDocument,
  StockLinesCountDocument,
  StocktakeDetailFragment,
  StocktakeDocument,
  StocktakeLineFragment,
  StocktakeLinesDocument,
  StocktakeRowFragment,
  StocktakesDocument,
  UpdateStocktakeDocument,
  type StocktakeDetail,
  type StocktakeLine,
  type StocktakeLineListParams,
  type StocktakeListParams,
  type StocktakeRow,
  type UpdateStocktakePatch,
  StockLineForStocktakeFragment,
  StockLinesByItemDocument,
  UpsertStocktakeLinesDocument,
  type StockLineForStocktake,
} from "./operations";
import type { VariablesOf } from "../../../../graphql/graphql";

export type InsertStocktakeLineInput = NonNullable<
  VariablesOf<typeof UpsertStocktakeLinesDocument>["insert"]
>[number];
export type UpdateStocktakeLineInput = NonNullable<
  VariablesOf<typeof UpsertStocktakeLinesDocument>["update"]
>[number];
export type DeleteStocktakeLineInput = NonNullable<
  VariablesOf<typeof UpsertStocktakeLinesDocument>["delete"]
>[number];
export type UpsertStocktakeLinesResult = Awaited<ReturnType<StocktakeQueries["saveLines"]>>;

export type StockLinesCountFilter = NonNullable<VariablesOf<typeof StockLinesCountDocument>["filter"]>;
export type ItemsCountFilter = NonNullable<VariablesOf<typeof ItemsCountDocument>["filter"]>;

/** Result of a list query: the page of rows plus the server-side total. */
export interface StocktakeListResult {
  rows: StocktakeRow[];
  totalCount: number;
}

const LINE_SORT_KEYS = new Set([
  "itemCode",
  "itemName",
  "batch",
  "expiryDate",
  "packSize",
  "locationCode",
  "snapshotNumberOfPacks",
  "countedNumberOfPacks",
  "reasonOption",
]);

/**
 * The query/mutation functions for the stocktake area, scoped to a store.
 * `get.*` are higher-order (return a thunk) so params can be captured for the
 * query key; direct mutations (update/delete/insert) will be added here later.
 */
export const getStocktakeQueries = (storeId: string) => ({
  get: {
    /** A page of stocktakes for the store (server-side filter / sort / paging). */
    list: (params: StocktakeListParams) => async (): Promise<StocktakeListResult> => {
      const data = await request(StocktakesDocument, {
        storeId,
        page: { first: params.first, offset: params.offset },
        sort: params.sortBy ? [{ key: params.sortBy.key, desc: params.sortBy.desc }] : undefined,
        filter: params.filterBy,
      });
      return {
        rows: [...readFragment(StocktakeRowFragment, data.stocktakes.nodes)],
        totalCount: data.stocktakes.totalCount,
      };
    },
    /** A single stocktake document by id. Throws if not found. */
    byId: (stocktakeId: string) => async (): Promise<StocktakeDetail> => {
      const data = await request(StocktakeDocument, { stocktakeId, storeId });
      if (data.stocktake.__typename !== "StocktakeNode") throw new Error("Could not find stocktake!");
      return readFragment(StocktakeDetailFragment, data.stocktake);
    },
    /** The lines for a stocktake (server-side sort/filter/paging). */
    lines:
      (stocktakeId: string, params: StocktakeLineListParams) =>
      async (): Promise<{ rows: StocktakeLine[]; totalCount: number }> => {
        const sortBy = params.sortBy;
        const data = await request(StocktakeLinesDocument, {
          stocktakeId,
          storeId,
          page:
            params.first != null || params.offset != null
              ? { first: params.first, offset: params.offset }
              : undefined,
          sort: sortBy
            ? [{ key: LINE_SORT_KEYS.has(sortBy.key) ? sortBy.key : "itemName", desc: sortBy.desc }]
            : undefined,
          filter: params.filterBy,
        });
        return {
          rows: [...readFragment(StocktakeLineFragment, data.stocktakeLines.nodes)],
          totalCount: data.stocktakeLines.totalCount,
        };
      },
    /** Available stock lines for an item (to seed uncounted draft rows). */
    stockLinesByItem: (itemId: string) => async (): Promise<StockLineForStocktake[]> => {
      const data = await request(StockLinesByItemDocument, { storeId, itemId });
      return data.stockLines.__typename === "StockLineConnector"
        ? [...readFragment(StockLineForStocktakeFragment, data.stockLines.nodes)]
        : [];
    },
  },
  /** Batch insert/update/delete of stocktake lines; returns the raw batch response. */
  saveLines: async (input: {
    insert: InsertStocktakeLineInput[];
    update: UpdateStocktakeLineInput[];
    delete: DeleteStocktakeLineInput[];
  }) => {
    const data = await request(UpsertStocktakeLinesDocument, {
      storeId,
      insert: input.insert,
      update: input.update,
      delete: input.delete,
    });
    return data.batchStocktake;
  },
  /** Update a stocktake document field(s). Returns the raw union result. */
  update: async (patch: UpdateStocktakePatch) => {
    const data = await request(UpdateStocktakeDocument, {
      storeId,
      input: {
        id: patch.id,
        comment: patch.comment,
        description: patch.description,
        countedBy: patch.countedBy,
        verifiedBy: patch.verifiedBy,
        isLocked: patch.isLocked,
        status: patch.status === "FINALISED" ? "FINALISED" : undefined,
      },
    });
    return data.updateStocktake;
  },
  /** Create a stocktake (id generated here). Returns the new id, or undefined. */
  insertStocktake: async (input: CreateStocktakeInput): Promise<string | undefined> => {
    const id = crypto.randomUUID();
    const data = await request(InsertStocktakeDocument, { storeId, input: { id, ...input } });
    return data.insertStocktake.__typename === "StocktakeNode" ? data.insertStocktake.id : undefined;
  },
  /** Count of stock lines matching a filter (create-modal estimate). */
  stockLinesCount: async (filter: StockLinesCountFilter): Promise<number> => {
    const data = await request(StockLinesCountDocument, { storeId, filter });
    return data.stockLines.__typename === "StockLineConnector" ? data.stockLines.totalCount : 0;
  },
  /** Count of items matching a filter (create-modal estimate). */
  itemsCount: async (filter: ItemsCountFilter): Promise<number> => {
    const data = await request(ItemsCountDocument, { storeId, filter });
    return data.items.__typename === "ItemConnector" ? data.items.totalCount : 0;
  },
  /** Delete a set of stocktakes (maps rows → `{ id }[]`). */
  deleteStocktakes: async (rows: Pick<StocktakeRow, "id">[]) => {
    const data = await request(DeleteStocktakesDocument, {
      storeId,
      ids: rows.map((r) => ({ id: r.id })),
    });
    return data.batchStocktake.deleteStocktakes ?? [];
  },
});

export type StocktakeQueries = ReturnType<typeof getStocktakeQueries>;
