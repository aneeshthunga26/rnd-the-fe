# Solid 2.0 — the next major version & its new reactivity model

A reference for an AI coding agent on what changes in **SolidJS 2.0** (a major, breaking release) versus 1.x: the rewritten reactive core (`@solidjs/signals`), first‑class async, deterministic batching, split effects, and the full API rename/removal map.

---

> ## ⚠️ STATUS / STABILITY DISCLAIMER — READ FIRST
>
> - **Solid 2.0 is in BETA, not stable.** As of mid‑2026 the published versions are
>   `solid-js@2.0.0-beta.x` and `@solidjs/signals@2.0.0-beta.15` (both on the npm `next`
>   dist‑tag). `solid-js@latest` is still **1.9.x** — the overwhelming majority of real
>   codebases, libraries, tutorials, and Stack Overflow answers are **1.x**.
> - **The 2.0 API is still moving.** The `@solidjs/signals` README itself says: *"The API is
>   stabilizing but may still have breaking changes before a final release."* Several APIs below
>   have *already* changed shape between betas (e.g. `Reveal`'s `together` boolean → `order`
>   prop). Treat every 2.0 API name as "true for beta.15, verify before relying on it."
> - **For an AI agent:** unless a project's `package.json` pins `solid-js@^2` / `2.0.0-beta.*`
>   or `@solidjs/signals`, **assume 1.x and use the 1.x docs** (`01`–`08` in this set). Do not
>   silently emit 2.0 APIs (`Loading`, `createAsync`/async-memo, `action`, draft setters) into a
>   1.x project — they will not exist.
> - This doc distinguishes **Confirmed** (in shipped beta release notes / official RFC docs / the
>   published package), **Likely** (stated intent that may shift), and **Proposed/Open** (still
>   under discussion). When in doubt, prefer flagging uncertainty over emitting a confident‑but‑wrong API.

---

## 1. Overview: what 2.0 changes and why

**Confirmed.** Solid 2.0 is a ground‑up rewrite of the reactive runtime around a new standalone
package, **`@solidjs/signals`**, *"the reactive core that powers SolidJS 2.0 … with first‑class
support for async, transitions, optimistic updates, and deeply reactive stores."*
([@solidjs/signals README, `next` branch](https://github.com/solidjs/solid/blob/next/packages/solid-signals/README.md))

The headline themes (from the official [v2.0.0‑beta.0 release notes](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0), "The Big Ideas"):

- **Async is first‑class.** Computations (`createMemo`, derived stores) can return `Promise`s *or*
  `AsyncIterable`s, and the reactive graph knows how to suspend/resume work. This **removes
  `createResource` entirely.**
- **`<Loading>` is for initial readiness** (renamed from `<Suspense>`); revalidation no longer tears
  down the UI.
- **Pending UI is an expression, not a flag:** `isPending(() => expr)`.
- **Mutations have a home:** `action(...)` + optimistic primitives (`createOptimistic`,
  `createOptimisticStore`).
- **Derived state is a primitive:** function forms `createSignal(fn)` and `createStore(fn)`.
- **A more predictable scheduler:** updates are microtask‑batched and **reads don't update until the
  batch flushes** (`flush()`). This replaces explicit `batch()`.
- **Dev guardrails:** dev warnings catch top‑level reactive reads in components and writes inside
  reactive scopes.
- **DOM model cleanup:** `use:` directives → `ref` directive factories; `classList` folded into
  `class`.

**Why** (from [RFC 01](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/01-reactivity-batching-effects.md)
and [RFC 05](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md)):
1.x had *two* parallel models — synchronous signals and async resources — that didn't compose, plus
error/loading state split across `resource.error`/`resource.loading` and `ErrorBoundary`/`Suspense`.
2.0 unifies async into the graph so effects, boundaries, and SSR/hydration treat it consistently, and
removes the `T | undefined` "loading holes" from types.

### Timeline / status

**Confirmed.** Development of the `2.0.0-experimental` line began ~February 2025. The team skipped a
formal **Alpha** phase and jumped from Experimental to **Beta** (announced in the v2.0.0‑beta.0
notes). Ryan Carniato: *"we spent so long iterating in the Experimental phase, most of the goalposts
within Alpha don't appear relevant enough to warrant their own phase."*
([release notes](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0);
[InfoQ, May 2026](https://www.infoq.com/news/2026/05/solidjs-2-async/)). No final‑release date is
committed; Beta focus is docs, migration tooling, and ecosystem porting (router, Vite plugin under the
`next` npm tag, etc.).

> **Naming note for an AI agent.** Web search results and some blog posts say the 2.0 async primitive
> is **`createAsync`**. That is *imprecise*. `createAsync` is a **1.x `@solidjs/router` API** (a
> resource wrapper). In Solid **2.0 core**, the replacement for `createResource` is simply an **async
> `createMemo`** (a memo that returns a `Promise`/`AsyncIterable`) consumed under `<Loading>`. Some
> commentary uses "createAsync" loosely to mean "the new async story." Prefer the documented async
> `createMemo` form when targeting 2.0 core. (See [RFC 05](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md).)

---

## 2. The new reactivity engine: `@solidjs/signals`

**Confirmed.** `@solidjs/signals` is published on npm (`2.0.0-beta.15`, `next` tag) and developed in
the Solid monorepo at `packages/solid-signals`. It is *"a push‑pull hybrid reactive system. Signals
hold values, computeds derive from them, and effects run side effects — all connected through an
automatic dependency graph. Updates are batched and flushed asynchronously via microtask."*
([README](https://github.com/solidjs/solid/blob/next/packages/solid-signals/README.md))

> Note: there is a *separate* repo URL `github.com/solidjs/signals` referenced in package metadata,
> but the authoritative, readable source lives in the main monorepo's `packages/solid-signals`
> directory on the `next` branch.

### 2.1 Push‑pull graph algorithm

**Confirmed (concept) / Likely (exact flag names).** Like 1.x, the graph is **push‑pull**, but the 2.0
implementation is a from‑scratch rewrite with explicit node **state flags** (a graph‑coloring scheme):

- **Push (invalidation):** when a signal is written, it eagerly marks dependents — but it does *not*
  recompute them. Internal flags include `REACTIVE_CHECK` ("may be stale, verify dependencies") and
  `REACTIVE_DIRTY` ("definitely needs recompute"); there are also lane/boundary flags such as
  `REACTIVE_ZOMBIE` (disposed but still subscribed) and `REACTIVE_OPTIMISTIC_DIRTY` (optimistic‑update
  lane). ([`docs/BITWISE_OPERATIONS.md`](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/BITWISE_OPERATIONS.md))
- **Pull (re‑evaluation):** a node only recomputes when it is *read* and a "check" walk confirms a
  real upstream change. A computed that goes dirty but is never read never recomputes — this is the
  classic Solid laziness, preserved.
- **Boundary‑aware propagation:** propagation uses a `(mask, flags)` pair so that **error and loading
  boundaries can intercept specific status changes** (e.g. "not ready", "errored") as they travel up
  the graph, instead of a naive observer that notifies everyone. This is what lets async/loading state
  flow *through* the same graph as ordinary values.
  ([`docs/QUEUE_NOTIFICATION_SYSTEM.md`](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/QUEUE_NOTIFICATION_SYSTEM.md))

Conceptual background on push‑pull coloring (not 2.0‑specific):
[Willy Brauner — "Signals, the push‑pull based algorithm"](https://willybrauner.com/journal/signal-the-push-pull-based-algorithm).

### 2.2 Improvements over 1.x

- **Async‑native graph:** "not ready" (pending) and errors are first‑class *states a node can be in*,
  propagated to `Loading`/`Errored` boundaries — no separate resource subsystem. (Confirmed)
- **Deterministic microtask batching** with explicit `flush()` (see §4). (Confirmed)
- **Transitions / optimistic lanes** built into the core (the optimistic‑dirty flag), so optimistic
  updates and concurrent transitions are scheduler concepts, not userland wrappers. (Confirmed)
- **Lazy + auto‑disposing memos** and an `unobserved` callback for resource cleanup (see §3.4).
  (Confirmed)

> **Caveat (Confirmed).** The beta intentionally **lacks dev‑tools hooks** because the signals
> implementation was rewritten from scratch; `enableExternalSource` and `SuspenseList` are also not
> yet fleshed out. ([release notes](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0))

---

## 3. API changes: signals, memos, effects, ownership

> All items below are **Confirmed** from the official RFC docs on the `next` branch unless flagged.
> Primary sources:
> [RFC 01 reactivity](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/01-reactivity-batching-effects.md),
> [RFC 02 signals/ownership](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/02-signals-derived-ownership.md),
> [MIGRATION.md](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md).

### 3.1 Split effects (compute → apply)

`createEffect` now takes **two** functions: a **compute** phase (reactive reads only; records
dependencies) and an **apply/effect** phase (side effects; runs after the batch flushes; may return
cleanup).

```tsx
// 1.x — single function
createEffect(() => { el().title = name(); });

// 2.0 — split: compute returns a value, apply consumes it
createEffect(
  () => name(),          // compute: tracked reads only
  (value, prev) => {     // apply: side effects, runs after flush
    el().title = value;
    return () => { /* cleanup */ };
  }
);
```

- The 1.x `initialValue` second arg is **gone**. The compute receives `prev` (`undefined` on first
  run); use a default parameter (`(prev = 0) => ...`) if you need a seed.
- `createMemo`'s second arg is now `options`, **not** an initial value.
- `createRenderEffect` uses the same split shape but runs synchronously in the render phase (used by
  the runtime for DOM bindings).
- **Error handling:** `createEffect`'s second arg can be an `EffectBundle` `{ effect, error }`:

  ```tsx
  createEffect(
    () => fetchData(id()),
    {
      effect: data => renderData(data),
      error: (err, cleanup) => { console.error(err); cleanup(); },
    }
  );
  ```

- `createTrackedEffect` is a single‑callback escape hatch (may re‑run in async situations); not the
  default.

### 3.2 New / changed signal forms

- **Writable derived signal (function form):** `createSignal(fn)` — "a memo you can also set."
  Replaces many `createComputed` write‑back patterns. (Confirmed)

  ```tsx
  const [count, setCount] = createSignal(0);
  const [doubled] = createSignal(() => count() * 2); // writable memo
  ```

- **`unobserved` callback** on `createSignal`/`createMemo` — fires when the node loses its last
  subscriber (cleanup external resources). (Confirmed)
- **`createMemo(fn, { lazy: true })`** — defers first computation until first read, and opts the memo
  into **autodisposal** (torn down when subscriber count hits zero, recomputed on next read).
  Non‑lazy *owned* memos live for their owner's lifetime; *unowned* memos autodispose. (Confirmed)
- **`ownedWrite: true`** option — writing to a signal inside a reactive scope **throws in dev** by
  default; this opts a specific signal out (intended for narrow internal state, not app state).
  (Confirmed)

### 3.3 Ownership & context

- **`createRoot` is owned by its parent by default.** A root created inside an owned scope is disposed
  with the parent. To get a truly detached/"forever" root, use `runWithOwner(null, () => ...)`
  explicitly. (Confirmed — [RFC 02](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/02-signals-derived-ownership.md))
- **Context value *is* the provider:** `<ThemeContext value="dark">…</ThemeContext>` — `Context.Provider`
  is removed. (Confirmed)
- **`createContext<T>()` (no default) is typed `Context<T>`**, so `useContext` returns `T` (not
  `T | undefined`) and throws `ContextNotFoundError` if no Provider is mounted. The ubiquitous 1.x
  "wrapper hook that throws to narrow the type" is no longer needed. (Confirmed)
- Note the standalone `@solidjs/signals` package exposes context as `setContext`/`getContext` +
  `createContext`; the `solid-js`/JSX layer keeps `useContext` + JSX provider ergonomics. (Confirmed)

### 3.4 Strict dev diagnostics (new)

Dev‑only guardrails ([RFC 08](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/08-dev-diagnostics.md)):

- **Top‑level reactive read warns:** reading a signal/prop at the top of a component body (incl.
  destructuring props in the parameter list) warns. Fix: read inside JSX/a memo/effect, or wrap in
  `untrack`.
- **Write inside a reactive scope throws** (memo/effect/component body). Fix: derive with `createMemo`,
  write in event handlers/actions, or opt in with `ownedWrite: true`.

---

## 4. Batching & the scheduler: `flush()`

**Confirmed.** All writes are batched on a **microtask** by default — there is **no `batch()`**.
Crucially, **reads do not reflect a write until the batch flushes**:

```tsx
const [count, setCount] = createSignal(0);
setCount(1);
count();   // still 0  (!)
flush();
count();   // now 1
```

- `flush()` forces "settle now" (useful before reading the DOM, e.g. focus, and in tests).
- `flush(fn)` runs the writes in `fn` in a synchronous flush scope and drains before returning.
- This is the behavioral change most likely to surprise code ported from 1.x (and the one beta testers
  flagged as a footgun). ([MIGRATION.md](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md),
  [InfoQ](https://www.infoq.com/news/2026/05/solidjs-2-async/))

---

## 5. Async / concurrency model (the big theme)

**Confirmed.** [RFC 05](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md)
makes async a property of *computations* rather than a separate primitive.

### 5.1 No more `createResource` — async computations + `<Loading>`

```tsx
// 1.x
const [user] = createResource(id, fetchUser);

// 2.0 — an async memo; reading user() follows the Loading path until it resolves
const user = createMemo(() => fetchUser(id()));

<Loading fallback={<Spinner />}>
  <Profile user={user()} />
</Loading>
```

Computations may return a `Promise` **or** an `AsyncIterable` (the latter replaces 1.x `from`/streaming
sources). Previous values are held in place until async work resolves, so consumers never see an
inconsistent state.

### 5.2 Initial load vs revalidation

- **`<Loading>`** (renamed from `<Suspense>`) = the **initial readiness** boundary; shows fallback only
  while a branch can't yet produce UI. After first content, revalidation does **not** kick back to the
  fallback by default.
- **`isPending(() => expr)`** = expression‑level "is this read touching pending async work right now"
  — used for "refreshing…" indicators. Placement matters: it performs the read, so a pending read
  participates in the same `Loading`/SSR readiness as reading the value directly.
- **`<Loading on={key()}>`** — re‑show the fallback when `key` changes *and* async is pending (route/key
  transitions).
- **`latest(fn)`** — peek at the in‑flight value during a transition (may fall back to stale).
- **`resolve(fn)`** — returns a `Promise` that resolves when a reactive expression settles (tests /
  imperative; cannot be called inside a reactive scope).

```tsx
const users = createMemo(() => fetchUsers());
const listPending = () => isPending(() => users());

<Loading fallback={<Spinner />}>
  <Show when={listPending()}>{/* subtle refreshing indicator */}</Show>
  <List users={users()} />
</Loading>;
```

### 5.3 Transitions are built in

`startTransition` / `useTransition` are **removed**. Transitions are a core scheduling concept; multiple
can be in flight, and "entangling" decides what blocks what. User‑facing surface = `isPending` +
`Loading` + the optimistic APIs. (Confirmed)

### 5.4 Mutations: `action()` + optimistic primitives

[RFC 06](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/06-actions-optimistic.md).
`action(fn)` wraps a **generator** (or async generator) mutation and runs it inside a transition:

```tsx
const [todos, setOptimisticTodos] = createOptimisticStore(() => api.getTodos(), []);

const addTodo = action(function* (todo) {
  setOptimisticTodos(s => { s.push(todo); }); // optimistic UI
  yield api.addTodo(todo);                     // server write
  refresh(todos);                              // reconcile derived reads with source of truth
});
```

- **`createOptimistic`** (signal) / **`createOptimisticStore`** (store): writes are optimistic and
  **revert when the transition completes**.
- **`refresh(target)`** = explicit "invalidate and recompute now" for a derived signal/store/projection
  (the replacement for `resource.refetch()`). It is an *action*, not a UI flag — call from handlers/
  effects/actions, not from pure computations.

### 5.5 Resource feature → 2.0 mapping (Confirmed)

| 1.x `createResource` feature | 2.0 replacement |
| --- | --- |
| the resource accessor | async `createMemo` (or `createStore(fn)` for collections) |
| `resource.loading` | `<Loading>` (initial) + `isPending(() => r())` (revalidation) |
| `resource.error` | `<Errored>` boundary or `createEffect` `error` option |
| `refetch()` | `refresh(r)` |
| `mutate()` | `createOptimisticStore` + `action` |

---

## 6. Stores

**Confirmed.** [RFC 04](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/04-stores.md)
+ MIGRATION. Stores now export from **`solid-js`** directly (no `solid-js/store` subpath).

- **Draft‑first setters by default** — the setter receives a mutable draft (this is what 1.x `produce`
  did; `produce` is now the default behavior, not an import):

  ```tsx
  setStore(s => { s.user.address.city = "Paris"; s.list.push("x"); });
  ```

  The old path‑style ergonomics survive as an opt‑in helper: `setStore(storePath("user","name","Alice"))`.
- **`createStore(fn, seed)`** — function form makes a **derived store** (may return a value / Promise /
  async iterable). `seed` is a real backing host object/array, **not** a memo‑style "initial value."
- **`createProjection(fn, seed)`** — derived store with reactive reconciliation (replaces
  `createSelector`).
- **`snapshot(store)`** replaces **`unwrap(store)`** (plain non‑reactive copy).
- **`deep(store)`** — subscribe to all nested changes, returns a plain snapshot (use in effect compute
  phase). **`reconcile(value, key)`** unchanged in spirit (diff server data into a store).
- **`createMutable` / `modifyMutable` removed** — use `createStore` with draft setters (writes must go
  through the setter to participate in batching/transitions/optimistic rollback).

---

## 7. Control flow & components

**Confirmed** ([RFC 03](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/03-control-flow.md)):

- **`<Index>` removed** → `<For each keyed={false}>`. `<For>`'s callback shape depends on keying:
  default/`keyed={true}` → `(item, indexAccessor)`; `keyed={false}` → `(itemAccessor, index)` (the
  direct `Index` replacement). Prefer **literal** `keyed` values (a dynamic boolean makes the callback
  shape ambiguous).
- **`<Suspense>` → `<Loading>`**, **`<ErrorBoundary>` → `<Errored>`** (fallback now receives an
  *accessor*: `err => err().message`), **`<SuspenseList>` → `<Reveal>`** (ordered via `order="sequential"
  | "together" | "natural"` + sequential‑only `collapsed`).
- **New control flow:** `<Repeat>` (count/range rendering, no diffing), `<Reveal>`, plus a `dynamic(source)`
  factory backing `<Dynamic>` (replaces `createDynamic(source, props)`; `<Dynamic>` JSX is unchanged at
  the call site).
- **Function children may receive accessors** (read via JSX expressions; reading in the callback body
  warns under strict diagnostics).

---

## 8. DOM, JSX & imports

**Confirmed** ([RFC 07](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/07-dom.md),
MIGRATION):

- **JSX runtime moved to renderer packages.** `solid-js` no longer owns JSX types. Web apps set
  `"jsxImportSource": "@solidjs/web"` in tsconfig; import `JSX`, `ComponentProps` from `@solidjs/web`;
  use `Element` (not `JSX.Element`) from `solid-js` for renderer‑neutral component types.
- **Import path moves:**
  - `solid-js/web` → **`@solidjs/web`**
  - `solid-js/store` → **`solid-js`** (store APIs hoisted into core)
  - `solid-js/h` → `@solidjs/h`; `solid-js/html` → `@solidjs/html`; `solid-js/universal` → `@solidjs/universal`
- **`use:` directives removed** → **`ref` directive factories** (`ref={tooltip({...})}`, arrays:
  `ref={[autofocus, tooltip()]}`), recommended as two‑phase (owned setup → unowned apply).
- **`classList` → `class`** object/array forms: `class={["card", { active: isActive() }]}`.
- **Attributes are closer to HTML:** generally lowercase, boolean presence/absence, and the `attr:` /
  `bool:` / `on:` / `oncapture:` namespaces are removed. Native listener options go through a `ref`
  callback. Delegated events are now owned by render roots (`clearDelegatedEvents()` removed — dispose
  the root instead).
- **`/*@once*/` JSX marker removed** — use normal reactive JSX, `untrack(() => props.x)` in JS for a
  genuine one‑time read, or platform defaults like `defaultValue`.

---

## 9. Quick rename / removal cheat‑sheet (Confirmed)

Source: [MIGRATION.md "Quick rename / removal map"](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md#quick-rename--removal-map).

**Renames**

| 1.x | 2.0 |
| --- | --- |
| `Suspense` | `Loading` |
| `SuspenseList` | `Reveal` |
| `ErrorBoundary` | `Errored` (fallback gets an accessor) |
| `mergeProps` | `merge` (note: `undefined` overrides, doesn't skip) |
| `splitProps` | `omit` |
| `createSelector` | `createProjection` / `createStore(fn)` |
| `createDynamic(source, props)` | `dynamic(source)` factory (`<Dynamic>` unchanged) |
| `unwrap` | `snapshot` |
| `onMount` | `onSettled` (can return cleanup; cannot create nested primitives) |
| `equalFn` | `isEqual` |
| `getListener` | `getObserver` |
| `classList` | `class` (object/array) |
| `Context.Provider` | `<Context value={...}>` |

**Removals**

| 1.x | Replacement |
| --- | --- |
| `createResource` | async `createMemo` / `createStore(fn)` + `<Loading>` |
| `startTransition` / `useTransition` | built‑in transitions + `isPending` / `Loading` / optimistic APIs |
| `batch` | `flush()` (batching is automatic) |
| `createComputed` | split `createEffect`, function‑form `createSignal`/`createStore`, or `createMemo` |
| `on` helper | unnecessary — compute phase declares deps; `defer` is an effect option |
| `onError` / `catchError` | `<Errored>` or effect `error` option |
| `produce` | now the default draft‑first setter |
| `createMutable` / `modifyMutable` | `createStore` + draft setter |
| `from` / `observable` | async iterables (in) / `createEffect` push (out) — `observable()` has **no drop‑in equivalent yet** |
| `createDeferred` | removed (handle outside Solid) |
| `indexArray` | `mapArray(..., { keyed: false })` |
| `resetErrorBoundaries` | gone — boundaries self‑heal |
| `enableScheduling`, `writeSignal` | removed |
| `use:` directives | `ref` directive factories |
| `attr:` / `bool:` / `on:` / `oncapture:` namespaces | standard attribute/event behavior |
| `solid-js/jsx-runtime` | renderer runtime entry (e.g. `@solidjs/web/jsx-runtime`) |

---

## 10. Migration notes — what an LLM should watch for

When you *know* a project targets 2.0 (`solid-js@2`/`@solidjs/signals`):

1. **Reads lag writes.** After `setX(v)`, `x()` returns the *old* value until `flush()` / next
   microtask. Don't write code that reads back a just‑written signal synchronously without `flush()`.
2. **Effects are split.** Never emit the 1.x single‑callback `createEffect(() => { read(); side(); })`.
   Put tracked reads in the compute fn, side effects in the apply fn, cleanup as the apply's return.
3. **No `createResource`, no `batch`, no `Index`, no `Suspense`/`ErrorBoundary` by those names, no
   `produce`, no `createMutable`, no `useContext`‑returns‑undefined.** Use the §9 mappings.
4. **Don't write inside reactive scopes** (memo/effect/component body) — it throws in dev. Derive or
   write in handlers/actions.
5. **Don't read reactive values (or destructure props) at component top level** — warns. Read in JSX or
   a memo, or `untrack`.
6. **Imports moved** — `@solidjs/web` for the DOM runtime, store APIs from `solid-js`, JSX types from
   `@solidjs/web`; set `jsxImportSource` accordingly.
7. **Context** — provider is the context itself; default‑less context throws if unprovided (drop the
   throw‑wrapper hooks).
8. **"createAsync" caution** — in 2.0 *core*, prefer the documented async `createMemo`; `createAsync` is
   a router‑level 1.x concept that may or may not survive as‑is. Verify against the project's installed
   router version.

When you **don't** know the version: **assume 1.x.** Emitting 2.0 APIs into a 1.x project is a hard
failure (the symbols don't exist).

---

## 11. Sources

- [Solid v2.0.0‑beta.0 release notes](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0) (primary — "The Big Ideas", examples, breaking changes)
- [Solid 2.0 MIGRATION.md (`next` branch)](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md) (primary — full rename/removal map)
- RFC docs on `next` branch (primary): [01 reactivity/batching/effects](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/01-reactivity-batching-effects.md), [02 signals/derived/ownership](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/02-signals-derived-ownership.md), [03 control flow](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/03-control-flow.md), [04 stores](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/04-stores.md), [05 async data](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md), [06 actions/optimistic](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/06-actions-optimistic.md), [07 DOM](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/07-dom.md), [08 dev diagnostics](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/08-dev-diagnostics.md), [09 TypeScript/JSX](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/09-typescript-jsx.md)
- [@solidjs/signals README (`next` branch)](https://github.com/solidjs/solid/blob/next/packages/solid-signals/README.md) (primary — reactive core API & async/store surface)
- [@solidjs/signals internals docs](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/) — [BITWISE_OPERATIONS.md](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/BITWISE_OPERATIONS.md), [QUEUE_NOTIFICATION_SYSTEM.md](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/QUEUE_NOTIFICATION_SYSTEM.md), [QUEUE_EXECUTION_CONTROL.md](https://github.com/solidjs/solid/blob/next/packages/solid-signals/docs/QUEUE_EXECUTION_CONTROL.md) (graph flags / scheduler)
- npm dist‑tags: `solid-js@next = 2.0.0-beta.x`, `@solidjs/signals@next = 2.0.0-beta.15` (verified via npm registry, mid‑2026)
- [InfoQ — "SolidJS 2.0 Beta: First‑Class Async, Reworked Suspense and Deterministic Batching" (May 2026)](https://www.infoq.com/news/2026/05/solidjs-2-async/) (secondary)
- [Tomas Listiak — "The state of Solid.js in 2026"](https://listiak.dev/blog/the-state-of-solid-js-in-2026-signals-performance-and-growing-influence) (secondary)
- [Ryan Carniato — "Beyond Signals" talk (JSNation US 2025)](https://gitnation.com/contents/beyond-signals) / [YouTube](https://www.youtube.com/watch?v=DZPSAOBnBAM) (secondary, conceptual)
- [Willy Brauner — push‑pull algorithm explainer](https://willybrauner.com/journal/signal-the-push-pull-based-algorithm) (secondary, general concept)
