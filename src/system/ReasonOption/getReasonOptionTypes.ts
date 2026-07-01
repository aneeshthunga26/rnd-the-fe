// The six adjustment-reason types (verbatim from `ReasonOptionNodeType`).
export type ReasonOptionNodeType =
  | "POSITIVE_INVENTORY_ADJUSTMENT"
  | "NEGATIVE_INVENTORY_ADJUSTMENT"
  | "OPEN_VIAL_WASTAGE"
  | "RETURN_REASON"
  | "REQUISITION_LINE_VARIANCE"
  | "CLOSED_VIAL_WASTAGE";

/**
 * Picks which reason types are valid for an adjustment (ported verbatim from
 * open-mSupply's `getReasonOptionTypes`). For stocktake lines:
 * `isInventoryReduction` = counted < snapshot, `isVaccine` = item.isVaccine,
 * `isDispensary` = store is a dispensary.
 */
export const getReasonOptionTypes = (params: {
  isInventoryReduction: boolean;
  isVaccine?: boolean;
  isDispensary?: boolean;
}): ReasonOptionNodeType[] => {
  if (!params.isInventoryReduction) return ["POSITIVE_INVENTORY_ADJUSTMENT"];
  if (!params.isVaccine) return ["NEGATIVE_INVENTORY_ADJUSTMENT"];
  const types: ReasonOptionNodeType[] = ["CLOSED_VIAL_WASTAGE"];
  if (params.isDispensary) types.push("OPEN_VIAL_WASTAGE");
  return types;
};
