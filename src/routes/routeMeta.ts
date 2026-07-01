import { ROUTES, type RoutePath } from "./routes";

// Human titles per route (used by the mobile top bar / breadcrumbs).
export const ROUTE_TITLES: Record<RoutePath, string> = {
  [ROUTES.dashboard]: "Dashboard",
  [ROUTES.replenishment]: "Replenishment",
  [ROUTES.inventory]: "Inventory",
  [ROUTES.stock]: "Stock",
  [ROUTES.locations]: "Locations",
  [ROUTES.stocktakes]: "Stocktakes",
  [ROUTES.stocktakeDetail]: "Stocktake",
  [ROUTES.distribution]: "Distribution",
  [ROUTES.dispensary]: "Dispensary",
  [ROUTES.reports]: "Reports",
  [ROUTES.catalogue]: "Catalogue",
  [ROUTES.settings]: "Settings",
  [ROUTES.sync]: "Sync",
  [ROUTES.help]: "Help",
};

/** Title for the current pathname (exact match, else longest matching prefix). */
export function getRouteTitle(pathname: string): string {
  const match = (Object.keys(ROUTE_TITLES) as RoutePath[])
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_TITLES[match] : "";
}
