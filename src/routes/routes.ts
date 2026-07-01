// Single source of truth for app paths. Use ROUTES.* everywhere (nav links,
// route definitions, redirects) instead of raw strings.
export const ROUTES = {
  dashboard: "/dashboard",
  replenishment: "/replenishment",
  inventory: "/inventory",
  stock: "/inventory/stock",
  locations: "/inventory/locations",
  stocktakes: "/inventory/stocktakes",
  stocktakeDetail: "/inventory/stocktakes/:id",
  distribution: "/distribution",
  dispensary: "/dispensary",
  reports: "/reports",
  catalogue: "/catalogue",
  settings: "/settings",
  sync: "/sync",
  help: "/help",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
