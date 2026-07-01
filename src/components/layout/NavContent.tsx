import { type Component, type JSX, Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { ROUTES, type RoutePath } from "../../routes/routes";
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
    class={`flex items-center gap-3 rounded-lg py-2 text-sm text-gray-menu hover:bg-row-hover ${
      props.collapsed ? "justify-center px-2" : props.indent ? "pl-11 pr-3" : "px-3"
    }`}
    activeClass="bg-brand-light! text-brand! font-medium"
  >
    <Show when={props.icon}>
      <span class="text-current">{props.icon}</span>
    </Show>
    <Show when={!props.collapsed}>
      <span class="flex-1 truncate">{props.label}</span>
      <Show when={props.badge}>
        <span class="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {props.badge}
        </span>
      </Show>
    </Show>
  </A>
);

/** The nav menu, shared by the desktop sidebar and the mobile drawer. */
export const NavContent: Component<{ collapsed?: boolean; onNavigate?: () => void }> = (props) => {
  const location = useLocation();
  const inInventory = () => location.pathname.startsWith(ROUTES.inventory);

  return (
    <div class="flex h-full flex-col">
      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3">
        <NavItem href={ROUTES.dashboard} icon={<DashboardIcon />} label="Dashboard" {...props} />
        <NavItem href={ROUTES.replenishment} icon={<ReplenishmentIcon />} label="Replenishment" {...props} />

        {/* Inventory (expandable group) */}
        <div>
          <A
            href={ROUTES.stocktakes}
            title={props.collapsed ? "Inventory" : undefined}
            onClick={() => props.onNavigate?.()}
            class={`flex items-center gap-3 rounded-lg py-2 text-sm ${
              props.collapsed ? "justify-center px-2" : "px-3"
            } ${inInventory() ? "bg-brand-light font-medium text-brand" : "text-gray-menu hover:bg-row-hover"}`}
          >
            <InventoryIcon />
            <Show when={!props.collapsed}>
              <span class="flex-1">Inventory</span>
              <ChevronDownIcon class={`w-4 h-4 transition-transform ${inInventory() ? "" : "-rotate-90"}`} />
            </Show>
          </A>
          <Show when={inInventory() && !props.collapsed}>
            <div class="mt-0.5 space-y-0.5">
              <NavItem href={ROUTES.stock} label="Stock" indent end onNavigate={props.onNavigate} />
              <NavItem href={ROUTES.locations} label="Locations" indent end onNavigate={props.onNavigate} />
              <NavItem href={ROUTES.stocktakes} label="Stocktakes" indent end onNavigate={props.onNavigate} />
            </div>
          </Show>
        </div>

        <NavItem href={ROUTES.distribution} icon={<DistributionIcon />} label="Distribution" {...props} />
        <NavItem href={ROUTES.dispensary} icon={<DispensaryIcon />} label="Dispensary" {...props} />
        <NavItem href={ROUTES.reports} icon={<ReportsIcon />} label="Reports" {...props} />
      </nav>

      <nav class="space-y-0.5 px-3 pb-2">
        <NavItem href={ROUTES.catalogue} icon={<CatalogueIcon />} label="Catalogue" {...props} />
        <NavItem href={ROUTES.settings} icon={<SettingsIcon />} label="Settings" {...props} />
        <NavItem href={ROUTES.sync} icon={<SyncIcon />} label="Sync" badge="99+" {...props} />
        <NavItem href={ROUTES.help} icon={<HelpIcon />} label="Help" {...props} />
      </nav>
    </div>
  );
};
