// Domain types for the stocktakes list view skeleton.
// Mirrors the relevant fields of open-mSupply's StocktakeNode (list view subset).

export type StocktakeStatus = "NEW" | "FINALISED";

export interface Stocktake {
  id: string;
  stocktakeNumber: number;
  status: StocktakeStatus;
  /** When locked, the UI shows "On Hold" instead of the raw status. */
  isLocked: boolean;
  description: string;
  /** ISO datetime string; rendered raw for now (no formatting). */
  createdDatetime: string;
  comment: string;
}
