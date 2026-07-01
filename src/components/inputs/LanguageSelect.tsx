import { type Component, For } from "solid-js";
import { Menu, MenuItem } from "../ui/Menu";
import { CheckIcon, LanguageIcon } from "../icons";
import { LOCALE_LABELS, useI18n } from "../../intl";

interface LanguageSelectProps {
  /** Classes for the trigger button (so it can match the surrounding footer row). */
  triggerClass?: string;
  /** Size of the language icon (Tailwind sizing classes). */
  iconClass?: string;
  placement?: "bottom-start" | "bottom-end" | "bottom";
}

/**
 * Language switcher: an icon + the current language label that opens a menu of
 * the supported locales. Choosing one calls `setLocale`, which persists the
 * choice and updates `<html lang/dir>` + all `t(...)` strings live.
 */
export const LanguageSelect: Component<LanguageSelectProps> = (props) => {
  const { locale, setLocale, locales } = useI18n();
  return (
    <Menu
      placement={props.placement ?? "bottom-start"}
      width="12rem"
      triggerClass={props.triggerClass}
      trigger={
        <>
          <LanguageIcon class={props.iconClass ?? "w-3.5 h-3.5"} /> {LOCALE_LABELS[locale()]}
        </>
      }
    >
      <For each={locales}>
        {(l) => (
          <MenuItem onClick={() => setLocale(l)}>
            <span class="flex-1 truncate">{LOCALE_LABELS[l]}</span>
            {locale() === l ? <CheckIcon class="w-4 h-4 text-brand" /> : null}
          </MenuItem>
        )}
      </For>
    </Menu>
  );
};
