// Runtime config, overridable via a local `.env` / `.env.local` (VITE_* vars).
// Defaults target the open-mSupply dev server (run with `debug_no_access_control`).

export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:8000/graphql";

export const STORE_ID = import.meta.env.VITE_STORE_ID ?? "5B28901C52396E4BB098B9862CCF5DF9";

/** When true, the app uses local mock data instead of the GraphQL server. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
