import { createSignal } from "solid-js";
import type { ComboboxOption } from "./AsyncCombobox";

/**
 * A debounced string signal: `value()` updates `ms` after the last `set(v)`.
 * Feed `set` to a combobox `onInputChange` and read `value()` in the query.
 */
export function createDebounced(initial = "", ms = 400): [() => string, (v: string) => void] {
  const [value, setValue] = createSignal(initial);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const set = (v: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setValue(v), ms);
  };
  return [value, set];
}

/** Resolve a picked combobox option back to its source node (or keep current). */
export function resolvePick<T extends { id: string }>(
  option: ComboboxOption | null,
  rows: readonly T[],
  current: T | null,
): T | null {
  if (!option) return null;
  return rows.find((r) => r.id === option.value) ?? current;
}
