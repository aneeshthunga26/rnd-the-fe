import { type Component, Show } from "solid-js";
import { EditIcon, StoreIcon, UserIcon } from "../icons";
import { useI18n } from "../../intl";
import { LanguageSelect } from "../inputs/LanguageSelect";

const STORE_NAME = "SMS Liquica Store";

/**
 * Store / session bar. `sidebar` variant sits at the bottom of the desktop
 * sidebar; `bar` variant is the mobile bottom bar (icons spread in a row).
 */
export const StoreBar: Component<{ variant: "sidebar" | "bar"; collapsed?: boolean }> = (props) => {
  const { t } = useI18n();
  return (
    <Show
      when={props.variant === "bar"}
      fallback={
        <div class="border-t border-line px-4 py-3 text-xs text-muted">
          <div class={`flex items-center gap-2 text-fg ${props.collapsed ? "justify-center" : ""}`}>
            <StoreIcon class="w-4 h-4" />
            <Show when={!props.collapsed}>
              <span class="truncate font-medium">{STORE_NAME}</span>
            </Show>
          </div>
          <Show when={!props.collapsed}>
            <div class="mt-2 flex items-center gap-3">
              <button type="button" class="flex items-center gap-1 hover:text-fg">
                <EditIcon class="w-3.5 h-3.5" /> {t("action.edit")}
              </button>
              <LanguageSelect triggerClass="flex items-center gap-1 hover:text-fg" iconClass="w-3.5 h-3.5" />
            </div>
          </Show>
        </div>
      }
    >
      <div class="flex items-center divide-x divide-line border-t border-line bg-surface text-[11px] text-muted">
        <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
          <StoreIcon class="w-4 h-4" />
          <span class="max-w-[90px] truncate">{STORE_NAME}</span>
        </button>
        <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
          <EditIcon class="w-4 h-4" /> {t("action.edit")}
        </button>
        <button type="button" class="flex flex-1 items-center justify-center gap-1.5 px-2 py-2">
          <UserIcon class="w-4 h-4" />
        </button>
        <LanguageSelect
          placement="bottom-end"
          triggerClass="flex flex-1 items-center justify-center gap-1.5 px-2 py-2"
          iconClass="w-4 h-4"
        />
      </div>
    </Show>
  );
};
