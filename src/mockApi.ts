import type { Stocktake, StocktakeStatus } from "./types";

// Deterministic ~200-row mock dataset, generated once at module load.
// No randomness so results are stable across reloads (and easy to reason about).

const STATUSES: StocktakeStatus[] = ["NEW", "FINALISED"];

const DESCRIPTIONS = [
  "Monthly count",
  "Quarterly audit",
  "Cold room recount",
  "Vaccine fridge check",
  "Expiry sweep",
  "Annual full stocktake",
  "Spot check — shelf A",
  "Damaged stock review",
];

const COMMENTS = [
  "",
  "Counted by warehouse team",
  "Discrepancy in batch totals",
  "Pending supervisor review",
  "Recount required",
  "All lines reconciled",
];

function buildRow(i: number): Stocktake {
  const status = STATUSES[i % STATUSES.length];
  // Every 7th NEW stocktake is locked ("On Hold"); finalised rows are never locked.
  const isLocked = status === "NEW" && i % 7 === 0;
  const day = (i % 28) + 1;
  const month = (i % 12) + 1;
  const createdDatetime = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T09:${String(
    i % 60,
  ).padStart(2, "0")}:00Z`;

  return {
    id: `stk-${i + 1}`,
    stocktakeNumber: 1000 + i,
    status,
    isLocked,
    description: `${DESCRIPTIONS[i % DESCRIPTIONS.length]} #${i + 1}`,
    createdDatetime,
    comment: COMMENTS[i % COMMENTS.length],
  };
}

const DATA: Stocktake[] = Array.from({ length: 200 }, (_, i) => buildRow(i));

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Naive mock "API": returns ALL rows after a small simulated network delay.
 * Filtering and pagination are done client-side by the table for this first cut.
 */
export async function listStocktakes(): Promise<Stocktake[]> {
  await delay(250);
  return DATA;
}
