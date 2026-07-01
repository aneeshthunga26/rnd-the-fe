/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GraphQL endpoint. Defaults to the open-mSupply dev server. */
  readonly VITE_GRAPHQL_URL?: string;
  /** Store id passed as a variable to every operation. */
  readonly VITE_STORE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
