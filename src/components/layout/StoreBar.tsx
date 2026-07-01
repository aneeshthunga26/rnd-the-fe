import { type Component, Show } from "solid-js";
import { EditIcon, LanguageIcon, StoreIcon, UserIcon } from "../icons";

const STORE_NAME = "SMS Liquica Store";

/**
 * Store / session bar. `sidebar` variant sits at the bottom of the desktop
 * sidebar; `bar` variant is the mobile bottom bar (icons spread in a row).
 */
export const StoreBar: Component<{ variant: "sidebar" | "bar"; collapsed?: boolean }> = (props) => (
  <Show
    when={props.variant === "bar"}
    fallback={
      <div class="border-t border-line px-4 py-3 text-xs text-gray-muted">
        <div class={`flex items-center gap-2 text-gray-menu ${props.collapsed ? "justify-center" : ""}`}>
          <StoreIcon class="w-4 h-4" />
          <Show when={!props.collapsed}>
            <span class="truncate font-medium">{STORE_NAME}</span>
          </Show>
        </div>
        <Show when={!props.collapsed}>
          <div class="mt-2 flex items-center gap-3">
            <button type="button" class="flex items-center gap-1 hover:text-gray-menu">
              <EditIcon class="w-3.5 h-3.5" /> Edit
            </button>
            <button type="button" class="flex items-center gap-1 hover:text-gray-menu">
              <LanguageIcon class="w-3.5 h-3.5" /> English
            </button>
          </div>
        </Show>
      </div>
    }
  >
    <div class="flex items-center divide-x divide-line border-t border-line bg-sidebar text-[11px] text-gray-muted">
      <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
        <StoreIcon class="w-4 h-4" />
        <span class="max-w-[90px] truncate">{STORE_NAME}</span>
      </button>
      <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
        <EditIcon class="w-4 h-4" /> Edit
      </button>
      <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
        <UserIcon class="w-4 h-4" /> check
      </button>
      <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
        <LanguageIcon class="w-4 h-4" /> English
      </button>
    </div>
  </Show>
);
