# Design choice — GraphQL client (gql.tada, codegen-free)

**Decision:** type GraphQL with **gql.tada** — inline `graphql(\`…\`)` documents whose types are **inferred
from the schema at the type level** — over a tiny `fetch` transport that serialises with `print` from
**`@0no-co/graphql.web`**. No per-operation codegen; the only generated artifact is one schema-introspection
file, `src/graphql/graphql-env.d.ts` (via `pnpm gql:generate`).

**Why:**
- **Small bundle** — ships `@0no-co/graphql.web` (~5 KB) instead of `graphql-js` (~40 KB). No runtime `gql`
  parse.
- **Zero per-operation generated files** — no `operations.generated.ts` to keep in sync per query; types via
  `ResultOf`/`VariablesOf`, fragments composed with the `[Fragment]` arg + `readFragment`. Faster dev loop,
  fewer files, better LLM velocity.
- **End-to-end type safety** straight from `schema.graphql` (a snapshot pulled from the open-mSupply server,
  which itself *generates* the SDL via `export-graphql-schema`).

**Common misconception:** "codegen would create the operations." In *every* approach you hand-write the query
documents — codegen only emits their *types*. gql.tada does that inference without emitting files, so it's
**less** manual than graphql-codegen, not more. (See the sanity-check discussion; verified the agents use it
correctly.)

## Costs / trade-offs
- **TS-plugin dependency** — inference needs the `@0no-co/graphqlsp` editor plugin + the generated
  `graphql-env.d.ts`; CI must run `pnpm gql:generate` before `tsc` (wired into `typecheck`/`build`).
- **Schema drift** — `schema.graphql` is a committed snapshot; refresh with `pnpm schema:pull` /
  `schema:introspect` or types go stale.
- **Heavy type-level inference** — large schemas can slow the TS server a little; fine here.
- **Less "conventional"** than graphql-codegen — newer, smaller community than the codegen path.

## Alternatives rejected
- **graphql-codegen client-preset (open-mSupply's approach)** — battle-tested, but reintroduces `graphql-js`
  into the bundle and a per-change generate step. Against the small-bundle + velocity goals.

## Net
gql.tada buys small-bundle + zero-codegen + full inference; cost is an editor plugin + keeping the schema
snapshot fresh. Right trade for this app. Detail: `../CLAUDE.md` "Data layer organisation".
