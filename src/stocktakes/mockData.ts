import type { StocktakeRow } from "./api";

// Deterministic ~200-row mock dataset for offline dev (VITE_USE_MOCK=true).
// Shaped to match the StocktakeRow fragment so it drops straight into the table.

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

function buildRow(i: number): StocktakeRow {
  const status = i % 2 === 0 ? "NEW" : "FINALISED";
  const isLocked = status === "NEW" && i % 7 === 0;
  const day = (i % 28) + 1;
  const month = (i % 12) + 1;
  return {
    id: `stk-${i + 1}`,
    stocktakeNumber: 1000 + i,
    status,
    isLocked,
    description: `${DESCRIPTIONS[i % DESCRIPTIONS.length]} #${i + 1}`,
    createdDatetime: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T09:${String(
      i % 60,
    ).padStart(2, "0")}:00Z`,
    comment: COMMENTS[i % COMMENTS.length],
  };
}

const DATA: StocktakeRow[] = Array.from({ length: 200 }, (_, i) => buildRow(i));

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function mockStocktakeRows(): Promise<StocktakeRow[]> {
  await delay(250);
  return DATA;
}
