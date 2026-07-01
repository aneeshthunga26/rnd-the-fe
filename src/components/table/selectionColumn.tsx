import { type Component, createEffect } from "solid-js";
import type { ColumnDef } from "@tanstack/solid-table";

/**
 * A checkbox that supports the tri-state `indeterminate` (a DOM property, not an
 * attribute) via a ref effect. Clicks stop propagation so ticking a row's box
 * never triggers the row's click handler (e.g. opening a detail/edit view).
 */
export const TableCheckbox: Component<{
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (e: Event) => void;
  ariaLabel: string;
}> = (props) => {
  let ref!: HTMLInputElement;
  createEffect(() => {
    ref.indeterminate = !props.checked && !!props.indeterminate;
  });
  return (
    <input
      ref={ref}
      type="checkbox"
      class="h-4 w-4 cursor-pointer rounded border-line accent-brand"
      checked={props.checked}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      onClick={(e) => e.stopPropagation()}
      onChange={props.onChange}
    />
  );
};

/**
 * Shared leading selection column: a header checkbox that selects/clears the
 * current page and per-row checkboxes. Wired to the TanStack selection API so any
 * controlled table can reuse it. Rendered narrow and non-sortable.
 */
export function selectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    size: 48,
    enableSorting: false,
    enableResizing: false,
    header: (ctx) => (
      <TableCheckbox
        ariaLabel="Select all rows on this page"
        checked={ctx.table.getIsAllPageRowsSelected()}
        indeterminate={ctx.table.getIsSomePageRowsSelected()}
        onChange={() => ctx.table.toggleAllPageRowsSelected()}
      />
    ),
    cell: (ctx) => (
      <TableCheckbox
        ariaLabel="Select row"
        checked={ctx.row.getIsSelected()}
        disabled={!ctx.row.getCanSelect()}
        onChange={ctx.row.getToggleSelectedHandler()}
      />
    ),
  };
}
