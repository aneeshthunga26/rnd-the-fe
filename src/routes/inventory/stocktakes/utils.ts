import type { StocktakeDetail } from "./api/operations";

type StatusFields = Pick<StocktakeDetail, "status" | "isLocked">;

/** Disabled (read-only) when finalised or locked. Unknown → treated as disabled. */
export const isStocktakeDisabled = (s?: StatusFields | null): boolean =>
  !s || s.status !== "NEW" || s.isLocked;

/** The next status in the flow (only NEW → FINALISED), else null. */
export const getNextStocktakeStatus = (status: "NEW" | "FINALISED"): "FINALISED" | null =>
  status === "NEW" ? "FINALISED" : null;
