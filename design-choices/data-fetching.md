# Design choice — Data fetching (@tanstack/solid-query + per-vertical `api/`)

**Decision:** fetch through **`@tanstack/solid-query`** (`useQuery`/`useMutation`), and organise each vertical's
data behind a small **`api/` layer**: `operations.ts` (gql.tada docs + types) → `keys.ts` (storeId-scoped key
factory) → `api.ts` (`getXQueries(storeId)` fns) → `useXApi.ts` (hub) → `useX.ts` hooks → `index.ts` barrel.
Screens import hooks from `./api` and never call the transport or keys directly.

**Why:**
- **Cache / dedup / invalidation** — the real reason to add a query lib. It's exactly what open-mSupply uses
  react-query for (refetch-after-mutation). Mutations invalidate `keys.base()` (broad) or `keys.detail(id)`
  (narrow, prefix-matches lines) on success.
- **The layering mirrors open-mSupply** (keys → api fns → hub → hooks → barrel), so the port maps cleanly and
  the pattern scales per vertical.
- **The hub (`useXApi`) is the single injection point** for `storeId` (a config constant today; swap to a store
  context later with no downstream changes) — no SDK/client object to thread since the transport is a module fn.
- Pairs with gql.tada: the document's inferred `ResultOf` flows straight into `useQuery`'s `data`.

## Costs / trade-offs
- **+~12 KB gzip** for solid-query over bare `createResource`. Justified once you need caching/invalidation
  across screens (list ↔ detail ↔ mutations); use plain `createResource` only for trivial one-off reads.
- **Layering ceremony** — several small files per vertical (operations/keys/api/hub/hooks/barrel). Deliberate:
  consistent, testable, LLM-navigable. The hub currently just injects a config `storeId`, so it's light.
- **Manual invalidation reasoning** — you must pick broad vs narrow keys per mutation (documented; a sanity
  check flagged narrowing `useUpdateStocktake` from `base()` → `detail+list`).
- **Solid-query specifics** — options are a function `() => ({...})`, params passed as accessors for
  reactivity, `keepPreviousData` on paginated lists to avoid flashes.

## Alternatives rejected
- **Solid's own async only (`createResource`)** — no cross-route cache/dedup/invalidation; would hand-roll it.
- **urql/Apollo normalized cache** — heavier; a normalized cache is more than this app needs.

## Net
solid-query + the `api/` pattern gives cache/invalidation and a scalable, open-mSupply-shaped data layer for a
modest bundle cost. Detail: `../CLAUDE.md` "Data layer organisation"; refinement notes in
`../specs/refactor/SPEC.md` (Part A).
