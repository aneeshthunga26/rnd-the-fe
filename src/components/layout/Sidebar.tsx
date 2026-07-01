import { type Component, createSignal } from "solid-js";
import { Logo } from "../icons";
import { useI18n } from "../../intl";
import { NavContent } from "./NavContent";
import { StoreBar } from "./StoreBar";

/** Desktop left sidebar. Click the logo to collapse/expand (icon-only). */
export const Sidebar: Component = () => {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <aside
      class={`flex h-screen shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-200 ${
        collapsed() ? "w-[68px]" : "w-[230px]"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed() ? t("action.expand-sidebar") : t("action.collapse-sidebar")}
        class="flex items-center justify-center py-5 hover:opacity-80"
      >
        <Logo />
      </button>

      <div class="min-h-0 flex-1">
        <NavContent collapsed={collapsed()} />
      </div>

      <StoreBar variant="sidebar" collapsed={collapsed()} />
    </aside>
  );
};
