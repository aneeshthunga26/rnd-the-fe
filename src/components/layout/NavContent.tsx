import { type Component, type JSX, Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { ROUTES, type RoutePath } from "../../routes/routes";
import { useI18n } from "../../intl";
import {
  CatalogueIcon,
  ChevronDownIcon,
  DashboardIcon,
  DispensaryIcon,
  DistributionIcon,
  HelpIcon,
  InventoryIcon,
  ReplenishmentIcon,
  ReportsIcon,
  SettingsIcon,
  SyncIcon,
} from "../icons";

const NavItem: Component<{
  href: RoutePath;
  icon?: JSX.Element;
  label: string;
  indent?: boolean;
  end?: boolean;
  badge?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}> = (props) => (
  <A
    href={props.href}
    end={props.end}
    title={props.collapsed ? props.label : undefined}
    onClick={() => props.onNavigate?.()}
    class={`flex items-center gap-3 rounded-lg py-2 text-sm text-fg hover:bg-row-hover ${
      props.collapsed ? "justify-center px-2" : props.indent ? "ps-11 pe-3" : "px-3"
    }`}
    activeClass="bg-brand-light! text-brand! font-medium"
  >
    <Show when={props.icon}>
      <span class="text-current">{props.icon}</span>
    </Show>
    <Show when={!props.collapsed}>
      <span class="flex-1 truncate">{props.label}</span>
      <Show when={props.badge}>
        <span class="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-on-brand">
          {props.badge}
        </span>
      </Show>
    </Show>
  </A>
);

/** The nav menu, shared by the desktop sidebar and the mobile drawer. */
export const NavContent: Component<{ collapsed?: boolean; onNavigate?: () => void }> = (props) => {
  const { t } = useI18n();
  const location = useLocation();
  const inInventory = () => location.pathname.startsWith(ROUTES.inventory);

  return (
    <div class="flex h-full flex-col">
      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3">
        <NavItem href={ROUTES.dashboard} icon={<DashboardIcon />} label={t("app.dashboard")} {...props} />
        <NavItem
          href={ROUTES.replenishment}
          icon={<ReplenishmentIcon />}
          label={t("app.replenishment")}
          {...props}
        />

        {/* Inventory (expandable group) */}
        <div>
          <A
            href={ROUTES.stocktakes}
            title={props.collapsed ? t("app.inventory") : undefined}
            onClick={() => props.onNavigate?.()}
            class={`flex items-center gap-3 rounded-lg py-2 text-sm ${
              props.collapsed ? "justify-center px-2" : "px-3"
            } ${inInventory() ? "bg-brand-light font-medium text-brand" : "text-fg hover:bg-row-hover"}`}
          >
            <InventoryIcon />
            <Show when={!props.collapsed}>
              <span class="flex-1">{t("app.inventory")}</span>
              <ChevronDownIcon
                class={`w-4 h-4 transition-transform ${inInventory() ? "" : "-rotate-90 rtl:rotate-90"}`}
              />
            </Show>
          </A>
          <Show when={inInventory() && !props.collapsed}>
            <div class="mt-0.5 space-y-0.5">
              <NavItem href={ROUTES.stock} label={t("app.stock")} indent end onNavigate={props.onNavigate} />
              <NavItem
                href={ROUTES.locations}
                label={t("app.locations")}
                indent
                end
                onNavigate={props.onNavigate}
              />
              <NavItem
                href={ROUTES.stocktakes}
                label={t("app.stocktakes")}
                indent
                end
                onNavigate={props.onNavigate}
              />
            </div>
          </Show>
        </div>

        <NavItem
          href={ROUTES.distribution}
          icon={<DistributionIcon />}
          label={t("app.distribution")}
          {...props}
        />
        <NavItem href={ROUTES.dispensary} icon={<DispensaryIcon />} label={t("app.dispensary")} {...props} />
        <NavItem href={ROUTES.reports} icon={<ReportsIcon />} label={t("app.reports")} {...props} />
      </nav>

      <nav class="space-y-0.5 px-3 pb-2">
        <NavItem href={ROUTES.catalogue} icon={<CatalogueIcon />} label={t("app.catalogue")} {...props} />
        <NavItem href={ROUTES.settings} icon={<SettingsIcon />} label={t("app.settings")} {...props} />
        <NavItem href={ROUTES.sync} icon={<SyncIcon />} label={t("app.sync")} badge="99+" {...props} />
        <NavItem href={ROUTES.help} icon={<HelpIcon />} label={t("app.help")} {...props} />
      </nav>
    </div>
  );
};
