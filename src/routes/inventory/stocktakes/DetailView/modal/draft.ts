import type { LocationRow } from "../../../../../system/Location";
import type { NameRow } from "../../../../../system/Name";
import type { CampaignRow, ProgramRow } from "../../../../../system/CampaignOrProgram";
import type { ReasonOptionRow } from "../../../../../system/ReasonOption";
import type { VvmStatusRow } from "../../../../../system/VvmStatus";
import type { ItemStockOnHandRow } from "../../../../../system/Item";
import type { StockLineForStocktake, StocktakeLine } from "../../api";

/** The item shape a draft carries (compatible with item/stockLine/search sources). */
export interface DraftItem {
  id: string;
  code: string;
  name: string;
  unitName?: string | null;
  isVaccine: boolean;
  doses: number;
  defaultPackSize: number;
  restrictedLocationTypeId?: string | null;
  itemStoreProperties?: { defaultSellPricePerPack: number } | null;
}

/**
 * A stocktake line being edited. Mirrors `StocktakeLineFragment` (minus __typename)
 * plus edit flags: `countThisLine` (user intent), `isCreated` (→ insert),
 * `isUpdated` (→ update).
 */
export interface DraftStocktakeLine {
  id: string;
  stocktakeId: string;
  itemId: string;
  itemName: string;
  batch?: string | null;
  expiryDate?: string | null;
  manufactureDate?: string | null;
  packSize?: number | null;
  snapshotNumberOfPacks: number;
  countedNumberOfPacks?: number | null;
  sellPricePerPack?: number | null;
  costPricePerPack?: number | null;
  comment?: string | null;
  volumePerPack: number;
  donorId?: string | null;
  donorName?: string | null;
  itemVariantId?: string | null;
  item: DraftItem;
  location?: LocationRow | null;
  stockLine?: { id: string } | null;
  reasonOption?: ReasonOptionRow | null;
  vvmStatus?: VvmStatusRow | null;
  manufacturer?: NameRow | null;
  campaign?: CampaignRow | null;
  program?: ProgramRow | null;
  itemVariant?: StocktakeLine["itemVariant"];
  countThisLine: boolean;
  isCreated?: boolean;
  isUpdated?: boolean;
}

const uuid = () => crypto.randomUUID();

// Server line/stockline nested objects → the (fuller) search-input Row shapes.
const toLocationRow = (
  l: StocktakeLine["location"] | StockLineForStocktake["location"],
): LocationRow | null => (l ? { ...l, volume: 0, volumeUsed: 0 } : null);
const toNameRow = (m: StocktakeLine["manufacturer"]): NameRow | null =>
  m ? { ...m, isOnHold: false } : null;

export const DraftLine = {
  /** A brand-new blank batch for an item (Add batch, or item pick). */
  fromItem(stocktakeId: string, item: DraftItem | ItemStockOnHandRow): DraftStocktakeLine {
    return {
      id: uuid(),
      stocktakeId,
      itemId: item.id,
      itemName: item.name,
      snapshotNumberOfPacks: 0,
      countedNumberOfPacks: undefined,
      expiryDate: null,
      sellPricePerPack: item.itemStoreProperties?.defaultSellPricePerPack ?? 0,
      costPricePerPack: 0,
      packSize: item.defaultPackSize,
      volumePerPack: 0,
      location: null,
      item,
      countThisLine: true,
      isCreated: true,
      isUpdated: false,
    };
  },

  /** An existing stock line not yet counted in this stocktake. */
  fromStockLine(stocktakeId: string, sl: StockLineForStocktake, countThisLine = false): DraftStocktakeLine {
    return {
      id: uuid(),
      stocktakeId,
      itemId: sl.itemId,
      itemName: sl.item.name,
      batch: sl.batch,
      expiryDate: sl.expiryDate ?? null,
      manufactureDate: sl.manufactureDate ?? null,
      packSize: sl.packSize,
      snapshotNumberOfPacks: sl.totalNumberOfPacks,
      countedNumberOfPacks: undefined,
      sellPricePerPack: sl.sellPricePerPack,
      costPricePerPack: sl.costPricePerPack,
      volumePerPack: sl.volumePerPack ?? 0,
      donorId: sl.donor?.id,
      donorName: sl.donor?.name,
      itemVariantId: sl.itemVariantId,
      item: sl.item,
      location: toLocationRow(sl.location),
      stockLine: { id: sl.id },
      vvmStatus: sl.vvmStatus,
      campaign: sl.campaign,
      program: sl.program,
      countThisLine,
      isCreated: true,
      isUpdated: false,
    };
  },

  /** An existing server stocktake line (already counted). */
  fromStocktakeLine(stocktakeId: string, line: StocktakeLine): DraftStocktakeLine {
    return {
      ...line,
      stocktakeId,
      location: toLocationRow(line.location),
      manufacturer: toNameRow(line.manufacturer),
      countThisLine: true,
      isCreated: false,
      isUpdated: false,
    };
  },
};
