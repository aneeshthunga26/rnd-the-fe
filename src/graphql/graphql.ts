import { initGraphQLTada } from "gql.tada";
import type { introspection } from "./graphql-env";

// The typed `graphql()` function. Types are inferred from the schema
// (see `schema.graphql` + the generated `graphql-env.d.ts`) — no per-operation
// codegen. Custom scalars are mapped to their TS representation here.
export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    DateTime: string;
    NaiveDate: string;
    NaiveDateTime: string;
    JSON: unknown;
    JSONObject: unknown;
  };
}>();

export { readFragment } from "gql.tada";
export type { FragmentOf, ResultOf, VariablesOf, TadaDocumentNode } from "gql.tada";
