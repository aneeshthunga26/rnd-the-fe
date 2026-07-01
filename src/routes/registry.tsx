import { lazy } from "solid-js";
import type { Component, JSX, ParentComponent } from "solid-js";
import { Route } from "@solidjs/router";
import { AppLayout } from "../layouts/AppLayout";
import { ROUTES, type RoutePath } from "./routes";

// Each screen default-exports its component. Screens are lazy-loaded so each
// gets its own code-split chunk fetched on first navigation. A route may opt
// into a different layout via the optional `layout` field (declared here, not
// on the module, since the layout must be known before the chunk is loaded).
type Entry = {
  path: RoutePath;
  component: Component;
  layout?: ParentComponent;
};

const entries: Entry[] = [
  { path: ROUTES.dashboard, component: lazy(() => import("./dashboard/DashboardScreen")) },
  { path: ROUTES.replenishment, component: lazy(() => import("./replenishment/ReplenishmentScreen")) },
  { path: ROUTES.stock, component: lazy(() => import("./inventory/stock/StockScreen")) },
  { path: ROUTES.locations, component: lazy(() => import("./inventory/locations/LocationsScreen")) },
  { path: ROUTES.stocktakes, component: lazy(() => import("./inventory/stocktakes/StocktakesScreen")) },
  {
    path: ROUTES.stocktakeDetail,
    component: lazy(() => import("./inventory/stocktakes/DetailView/DetailView")),
  },
  { path: ROUTES.distribution, component: lazy(() => import("./distribution/DistributionScreen")) },
  { path: ROUTES.dispensary, component: lazy(() => import("./dispensary/DispensaryScreen")) },
  { path: ROUTES.reports, component: lazy(() => import("./reports/ReportsScreen")) },
  { path: ROUTES.catalogue, component: lazy(() => import("./catalogue/CatalogueScreen")) },
  { path: ROUTES.settings, component: lazy(() => import("./settings/SettingsScreen")) },
  { path: ROUTES.sync, component: lazy(() => import("./sync/SyncScreen")) },
  { path: ROUTES.help, component: lazy(() => import("./help/HelpScreen")) },
];

/**
 * Build the route tree, grouping screens by their layout. Each layout becomes a
 * pathless parent route so the shell (sidebar/app bar) stays mounted while the
 * matched child screen swaps underneath it.
 */
export function buildRoutes(): JSX.Element {
  const groups = new Map<ParentComponent, Entry[]>();
  for (const entry of entries) {
    const layout = entry.layout ?? AppLayout;
    const list = groups.get(layout) ?? [];
    list.push(entry);
    groups.set(layout, list);
  }

  return [...groups.entries()].map(([Layout, list]) => (
    <Route component={Layout}>
      {list.map((e) => (
        <Route path={e.path} component={e.component} />
      ))}
    </Route>
  ));
}
