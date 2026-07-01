import type { Component } from "solid-js";
import { ColumnsIcon, FullscreenIcon, SettingsIcon } from "../icons";

/** Right-aligned table actions (columns / fullscreen / settings). Dummy for now. */
export const TableToolbar: Component = () => {
  const btn = "flex h-8 w-8 items-center justify-center rounded-md text-gray-menu hover:bg-row-hover";
  return (
    <div class="flex items-center justify-end gap-1 px-2 py-1">
      <button class={btn} title="Columns" type="button">
        <ColumnsIcon />
      </button>
      <button class={btn} title="Fullscreen" type="button">
        <FullscreenIcon />
      </button>
      <button class={btn} title="Settings" type="button">
        <SettingsIcon />
      </button>
    </div>
  );
};
