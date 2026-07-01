import { type Component, type JSX } from "solid-js";
import { ColumnsIcon, FullscreenIcon, SettingsIcon } from "../icons";
import { useI18n } from "../../intl";

/** Shared styling for the small square toolbar buttons (reused by menu triggers). */
export const toolbarBtnClass =
  "flex h-8 w-8 items-center justify-center rounded-md text-fg hover:bg-row-hover";

interface TableToolbarProps {
  /** 1st button slot — 03 fills this with the columns picker menu. */
  columns?: JSX.Element;
  /** 2nd button slot — 04 fills this with the fullscreen toggle. */
  fullscreen?: JSX.Element;
  /** 3rd button slot — 05 fills this with the table-settings menu. */
  settings?: JSX.Element;
}

/**
 * Right-aligned table actions (columns / fullscreen / settings). Each button is a
 * slot: a Wave-2 unit passes its interactive element, otherwise a dummy button
 * renders so the toolbar looks complete.
 */
export const TableToolbar: Component<TableToolbarProps> = (props) => {
  const { t } = useI18n();
  return (
    <div class="flex items-center justify-end gap-1 px-2 py-1">
      {props.columns ?? (
        <button class={toolbarBtnClass} title={t("label.columns")} type="button">
          <ColumnsIcon />
        </button>
      )}
      {props.fullscreen ?? (
        <button class={toolbarBtnClass} title={t("action.fullscreen")} type="button">
          <FullscreenIcon />
        </button>
      )}
      {props.settings ?? (
        <button class={toolbarBtnClass} title={t("label.table-settings")} type="button">
          <SettingsIcon />
        </button>
      )}
    </div>
  );
};
