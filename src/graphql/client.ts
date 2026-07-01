import { print } from "@0no-co/graphql.web";
import type { TadaDocumentNode } from "./graphql";
import { GRAPHQL_URL } from "./config";

/**
 * Minimal GraphQL transport. Accepts a gql.tada document and returns its
 * inferred result type. Uses `print` from `@0no-co/graphql.web` (no graphql-js)
 * to serialise the query, keeping the bundle small.
 */
export async function request<Result, Variables>(
  document: TadaDocumentNode<Result, Variables>,
  ...[variables]: Variables extends Record<string, never> ? [] : [Variables]
): Promise<Result> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: print(document), variables: variables ?? {} }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    data?: Result;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  if (!body.data) {
    throw new Error("GraphQL response contained no data");
  }
  return body.data;
}
