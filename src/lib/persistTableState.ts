import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  VisibilityState,
} from "@tanstack/solid-table";
import type { Density } from "../components/table/DataTable";

/** The table-state signals (from ListView) that get persisted. */
export interface TableStateSignals {
  columnVisibility: () => VisibilityState;
  setColumnVisibility: (v: VisibilityState) => void;
  columnOrder: () => ColumnOrderState;
  setColumnOrder: (v: ColumnOrderState) => void;
  columnPinning: () => ColumnPinningState;
  setColumnPinning: (v: ColumnPinningState) => void;
  columnSizing: () => ColumnSizingState;
  setColumnSizing: (v: ColumnSizingState) => void;
  density: () => Density;
  setDensity: (v: Density) => void;
}

export interface PersistedTableState {
  reset: () => void;
  resetOrder: () => void;
  resetSizes: () => void;
  resetPinned: () => void;
  resetVisibility: () => void;
  showAll: () => void;
}

const key = (tableId: string) => `rnd-the-fe/tables/${tableId}`;

/**
 * Binds table-state signals to `localStorage` under a `tableId` so density /
 * visibility / order / pinning / sizing survive reloads. Hydrates on mount,
 * persists on change (debounced), and returns the reset helpers the settings
 * menu calls. Resets clear the relevant slice from storage.
 */
export function usePersistedTableState(tableId: string, s: TableStateSignals): PersistedTableState {
  const storageKey = key(tableId);
  const [hydrated, setHydrated] = createSignal(false);

  onMount(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<{
          columnVisibility: VisibilityState;
          columnOrder: ColumnOrderState;
          columnPinning: ColumnPinningState;
          columnSizing: ColumnSizingState;
          density: Density;
        }>;
        if (saved.columnVisibility) s.setColumnVisibility(saved.columnVisibility);
        if (saved.columnOrder) s.setColumnOrder(saved.columnOrder);
        if (saved.columnPinning) s.setColumnPinning(saved.columnPinning);
        if (saved.columnSizing) s.setColumnSizing(saved.columnSizing);
        if (saved.density) s.setDensity(saved.density);
      }
    } catch {
      /* corrupt state — ignore */
    }
    setHydrated(true);
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = {
      columnVisibility: s.columnVisibility(),
      columnOrder: s.columnOrder(),
      columnPinning: s.columnPinning(),
      columnSizing: s.columnSizing(),
      density: s.density(),
    };
    if (!hydrated()) return; // don't clobber storage before hydrating
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(snapshot));
      } catch {
        /* quota / disabled storage — ignore */
      }
    }, 400);
  });
  onCleanup(() => timer && clearTimeout(timer));

  return {
    resetVisibility: () => s.setColumnVisibility({}),
    showAll: () => s.setColumnVisibility({}),
    resetOrder: () => s.setColumnOrder([]),
    resetPinned: () => s.setColumnPinning({ left: [], right: [] }),
    resetSizes: () => s.setColumnSizing({}),
    reset: () => {
      s.setColumnVisibility({});
      s.setColumnOrder([]);
      s.setColumnPinning({ left: [], right: [] });
      s.setColumnSizing({});
      s.setDensity("comfortable");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    },
  };
}
