import type { Component, JSX, ParentComponent } from "solid-js";
import { Route } from "@solidjs/router";
import { AppLayout } from "../layouts/AppLayout";
import { ROUTES, type RoutePath } from "./routes";

// Each screen default-exports its component and may optionally `export const
// layout` to choose a layout (defaults to AppLayout). Namespace imports let us
// read both the default component and the optional layout.
import * as Dashboard from "./DashboardScreen";
import * as Replenishment from "./ReplenishmentScreen";
import * as Distribution from "./DistributionScreen";
import * as Dispensary from "./DispensaryScreen";
import * as Reports from "./ReportsScreen";
import * as Catalogue from "./CatalogueScreen";
import * as Settings from "./SettingsScreen";
import * as Sync from "./SyncScreen";
import * as Help from "./HelpScreen";
import * as Stock from "./inventory/StockScreen";
import * as Locations from "./inventory/LocationsScreen";
import * as Stocktakes from "./inventory/stocktakes/StocktakesScreen";

type ScreenModule = { default: Component; layout?: ParentComponent };

const entries: { path: RoutePath; module: ScreenModule }[] = [
  { path: ROUTES.dashboard, module: Dashboard },
  { path: ROUTES.replenishment, module: Replenishment },
  { path: ROUTES.stock, module: Stock },
  { path: ROUTES.locations, module: Locations },
  { path: ROUTES.stocktakes, module: Stocktakes },
  { path: ROUTES.distribution, module: Distribution },
  { path: ROUTES.dispensary, module: Dispensary },
  { path: ROUTES.reports, module: Reports },
  { path: ROUTES.catalogue, module: Catalogue },
  { path: ROUTES.settings, module: Settings },
  { path: ROUTES.sync, module: Sync },
  { path: ROUTES.help, module: Help },
];

/**
 * Build the route tree, grouping screens by their layout. Each layout becomes a
 * pathless parent route so the shell (sidebar/app bar) stays mounted while the
 * matched child screen swaps underneath it.
 */
export function buildRoutes(): JSX.Element {
  const groups = new Map<ParentComponent, { path: RoutePath; module: ScreenModule }[]>();
  for (const entry of entries) {
    const layout = entry.module.layout ?? AppLayout;
    const list = groups.get(layout) ?? [];
    list.push(entry);
    groups.set(layout, list);
  }

  return [...groups.entries()].map(([Layout, list]) => (
    <Route component={Layout}>
      {list.map((e) => (
        <Route path={e.path} component={e.module.default} />
      ))}
    </Route>
  ));
}
