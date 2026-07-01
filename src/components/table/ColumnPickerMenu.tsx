import { For, type JSX } from "solid-js";
import type { Column, Table } from "@tanstack/solid-table";
import { Menu, MenuSeparator } from "../ui/Menu";
import { ColumnsIcon } from "../icons";
import { useI18n, type Translator } from "../../intl";
import { toolbarBtnClass } from "./TableToolbar";

/** Human label for a column: its string header, else a prettified id. */
function columnLabel<TData>(column: Column<TData, unknown>, t: Translator): string {
  if (column.id === "select") return t("label.select-column");
  const header = column.columnDef.header;
  if (typeof header === "string" && header) return header;
  return column.id.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Columns menu driven by a TanStack table instance: per-column visibility, pin
 * left/right, up/down reorder, plus HIDE ALL / SHOW ALL / RESET ORDER / UNPIN ALL.
 */
export function ColumnPickerMenu<TData>(props: { table: Table<TData> }): JSX.Element {
  const { t } = useI18n();
  // Columns in their current (columnOrder-respecting) order.
  const ordered = () => {
    const order = props.table.getState().columnOrder;
    const all = props.table.getAllLeafColumns();
    if (!order.length) return all;
    const idx = (id: string) => {
      const i = order.indexOf(id);
      return i < 0 ? order.length : i;
    };
    return [...all].sort((a, b) => idx(a.id) - idx(b.id));
  };

  const move = (from: number, to: number) => {
    const ids = ordered().map((c) => c.id);
    if (to < 0 || to >= ids.length) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    props.table.setColumnOrder(ids);
  };

  const hideAll = () =>
    props.table.getAllLeafColumns().forEach((c) => {
      if (c.id !== "select" && c.getCanHide()) c.toggleVisibility(false);
    });

  const iconBtn = (active: boolean) =>
    `flex h-6 w-6 items-center justify-center rounded text-xs ${
      active ? "bg-brand text-on-brand" : "text-muted hover:bg-row-hover"
    }`;

  const bulkBtn = "rounded px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light";

  return (
    <Menu
      trigger={<ColumnsIcon />}
      triggerClass={toolbarBtnClass}
      triggerTitle={t("label.columns")}
      title={t("label.columns")}
      width="20rem"
    >
      <div class="flex flex-wrap gap-1 border-b border-line px-2 pb-2">
        <button type="button" class={bulkBtn} onClick={hideAll}>
          {t("action.hide-all")}
        </button>
        <button type="button" class={bulkBtn} onClick={() => props.table.toggleAllColumnsVisible(true)}>
          {t("action.show-all")}
        </button>
        <button type="button" class={bulkBtn} onClick={() => props.table.resetColumnOrder()}>
          {t("action.reset-order")}
        </button>
        <button type="button" class={bulkBtn} onClick={() => props.table.resetColumnPinning()}>
          {t("action.unpin-all")}
        </button>
      </div>

      <For each={ordered()}>
        {(column, index) => (
          <div class="flex items-center gap-2 px-2 py-1.5">
            <div class="flex flex-col">
              <button
                type="button"
                class="text-[9px] leading-none text-muted hover:text-brand disabled:opacity-30"
                disabled={index() === 0}
                onClick={() => move(index(), index() - 1)}
                aria-label={t("action.move-up")}
              >
                ▲
              </button>
              <button
                type="button"
                class="text-[9px] leading-none text-muted hover:text-brand disabled:opacity-30"
                disabled={index() === ordered().length - 1}
                onClick={() => move(index(), index() + 1)}
                aria-label={t("action.move-down")}
              >
                ▼
              </button>
            </div>

            <span class="flex-1 truncate text-sm">{columnLabel(column, t)}</span>

            <button
              type="button"
              class={iconBtn(column.getIsPinned() === "left")}
              title={t("action.pin-left")}
              onClick={() => column.pin(column.getIsPinned() === "left" ? false : "left")}
            >
              L
            </button>
            <button
              type="button"
              class={iconBtn(column.getIsPinned() === "right")}
              title={t("action.pin-right")}
              onClick={() => column.pin(column.getIsPinned() === "right" ? false : "right")}
            >
              R
            </button>

            {/* Visibility pill */}
            <button
              type="button"
              role="switch"
              aria-checked={column.getIsVisible()}
              aria-label={columnLabel(column, t)}
              onClick={() => column.toggleVisibility()}
              class={`relative h-5 w-9 rounded-full transition-colors ${
                column.getIsVisible() ? "bg-brand" : "bg-line"
              }`}
            >
              <span
                class="absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all"
                classList={{ "start-0.5": !column.getIsVisible(), "start-4": column.getIsVisible() }}
              />
            </button>
          </div>
        )}
      </For>
      <MenuSeparator />
    </Menu>
  );
}
