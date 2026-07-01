import type { Component } from "solid-js";
import { Logo, MenuIcon } from "../icons";
import { useI18n } from "../../intl";
import type { RouteTitleKey } from "../../routes/routeMeta";

/** Mobile top bar: logo, page title, and a burger that opens the nav drawer. */
export const MobileHeader: Component<{ title?: RouteTitleKey; onMenu: () => void }> = (props) => {
  const { t } = useI18n();
  return (
    <header class="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
      <Logo class="w-8 h-8" />
      <h1 class="text-lg font-semibold">{props.title ? t(props.title) : ""}</h1>
      <button type="button" onClick={() => props.onMenu()} title={t("action.menu")} class="text-fg">
        <MenuIcon class="w-6 h-6" />
      </button>
    </header>
  );
};
