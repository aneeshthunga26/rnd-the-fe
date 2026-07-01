import type {
  DeleteStocktakeLineInput,
  InsertStocktakeLineInput,
  UpdateStocktakeLineInput,
} from "../../api";
import type { DraftStocktakeLine } from "./draft";

type NullableUpdate = { value: string | null } | undefined;

/**
 * `{ value }`-wrapper semantics: null entity → explicit clear `{ value: null }`;
 * missing key/undefined → omit (no change); else `{ value }`.
 */
function setNullable<K extends string>(
  key: K,
  entity: (Record<K, string | null | undefined> | null | undefined),
): NullableUpdate {
  if (entity === null) return { value: null };
  if (entity === undefined || entity[key] === undefined) return undefined;
  return { value: entity[key] ?? null };
}

export const toInsert = (line: DraftStocktakeLine): InsertStocktakeLineInput => ({
  id: line.id,
  stocktakeId: line.stocktakeId,
  location: setNullable("id", line.location),
  batch: line.batch ?? "",
  packSize: line.packSize ?? line.item.defaultPackSize,
  costPricePerPack: line.costPricePerPack,
  countedNumberOfPacks: line.countedNumberOfPacks,
  itemId: line.stockLine?.id ? undefined : line.itemId,
  sellPricePerPack: line.sellPricePerPack,
  stockLineId: line.stockLine?.id,
  expiryDate: line.expiryDate ?? undefined,
  manufactureDate: line.manufactureDate ?? undefined,
  comment: line.comment ?? "",
  itemVariantId: line.itemVariantId ?? undefined,
  donorId: line.donorId ?? undefined,
  manufacturerId: line.manufacturer?.id,
  reasonOptionId: line.reasonOption?.id,
  vvmStatusId: line.vvmStatus?.id,
  volumePerPack: line.volumePerPack,
  campaignId: line.campaign?.id,
  programId: line.program?.id,
});

export const toUpdate = (line: DraftStocktakeLine): UpdateStocktakeLineInput => ({
  id: line.id,
  location: setNullable("id", line.location),
  batch: line.batch ?? "",
  packSize: line.packSize ?? line.item.defaultPackSize,
  costPricePerPack: line.costPricePerPack,
  countedNumberOfPacks: line.countedNumberOfPacks,
  sellPricePerPack: line.sellPricePerPack,
  // Dates are always sent (wrapped), clearing to null when empty.
  expiryDate: { value: line.expiryDate ?? null },
  manufactureDate: { value: line.manufactureDate ?? null },
  comment: line.comment ?? "",
  itemVariantId: line.itemVariantId === undefined ? undefined : { value: line.itemVariantId },
  donorId: line.donorId === undefined ? undefined : { value: line.donorId },
  manufacturerId: { value: line.manufacturer?.id ?? null },
  reasonOptionId: line.reasonOption?.id,
  vvmStatusId: setNullable("id", line.vvmStatus ?? null),
  volumePerPack: line.volumePerPack,
  campaignId: setNullable("id", line.campaign ?? null),
  programId: setNullable("id", line.program ?? null),
});

export const toDelete = (line: DraftStocktakeLine): DeleteStocktakeLineInput => ({ id: line.id });

/** Partition drafts into the three batch buckets (see 09 §5). */
export const partitionDraftLines = (drafts: DraftStocktakeLine[]) => ({
  insert: drafts.filter((l) => l.isCreated && l.countThisLine).map(toInsert),
  update: drafts.filter((l) => !l.isCreated && l.isUpdated && l.countThisLine).map(toUpdate),
  delete: drafts.filter((l) => !l.isCreated && l.isUpdated && !l.countThisLine).map(toDelete),
});
