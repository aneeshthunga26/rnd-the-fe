import type { FlatDictionary } from "../intl";
import { ROUTES, type RoutePath } from "./routes";

/** A flattened *leaf* i18n key (e.g. "app.dashboard") — excludes namespace keys. */
export type RouteTitleKey = {
  [K in keyof FlatDictionary]: FlatDictionary[K] extends string ? K : never;
}[keyof FlatDictionary];

// i18n keys per route (translated by the AppBar / mobile top bar via `t`).
export const ROUTE_TITLES: Record<RoutePath, RouteTitleKey> = {
  [ROUTES.dashboard]: "app.dashboard",
  [ROUTES.replenishment]: "app.replenishment",
  [ROUTES.inventory]: "app.inventory",
  [ROUTES.stock]: "app.stock",
  [ROUTES.locations]: "app.locations",
  [ROUTES.stocktakes]: "app.stocktakes",
  [ROUTES.stocktakeDetail]: "app.stocktake",
  [ROUTES.distribution]: "app.distribution",
  [ROUTES.dispensary]: "app.dispensary",
  [ROUTES.reports]: "app.reports",
  [ROUTES.catalogue]: "app.catalogue",
  [ROUTES.settings]: "app.settings",
  [ROUTES.sync]: "app.sync",
  [ROUTES.help]: "app.help",
};

/** i18n key for the current pathname (exact match, else longest matching prefix). */
export function getRouteTitle(pathname: string): RouteTitleKey | undefined {
  const match = (Object.keys(ROUTE_TITLES) as RoutePath[])
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_TITLES[match] : undefined;
}
