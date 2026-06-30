# SolidJS Async Data: Resources, Suspense, and Transitions

Reference for Solid **1.x** async primitives: `createResource`, `<Suspense>`/`<SuspenseList>`, `useTransition`/`startTransition`, and `createDeferred`. All import from `solid-js`.

> Mental model: a **resource** is a signal whose value is produced asynchronously. Reading a pending resource inside a `<Suspense>` boundary makes that boundary show its fallback. Transitions let you swap async content without flashing the fallback. These are built-in reactive primitives — not a separate caching library.

---

## createResource

Creates an async-backed signal that tracks its own loading/error state and integrates with Suspense.

```ts
import { createResource } from "solid-js";

// Without a source (fetcher is called once on creation)
function createResource<T, R = unknown>(
  fetcher: ResourceFetcher<true, T, R>,
  options?: ResourceOptions<T, true>
): ResourceReturn<T, R>;

// With a reactive source (fetcher re-runs whenever source changes)
function createResource<T, S, R = unknown>(
  source: ResourceSource<S>,
  fetcher: ResourceFetcher<S, T, R>,
  options?: ResourceOptions<T, S>
): ResourceReturn<T, R>;

type ResourceReturn<T, R> = [Resource<T>, ResourceActions<T | undefined, R>];

type ResourceSource<S> =
  | S | false | null | undefined
  | (() => S | false | null | undefined);

type ResourceFetcher<S, T, R> = (
  k: S,                                // the current source value (or `true` if no source)
  info: ResourceFetcherInfo<T, R>      // { value, refetching }
) => T | Promise<T>;

type ResourceFetcherInfo<T, R> = {
  value: T | undefined;   // previous resolved value (useful for pagination/merging)
  refetching: R | boolean; // false normally; true (or the arg) when refetch() was called
};

type ResourceActions<T, R> = {
  mutate: Setter<T>;                                   // overwrite value locally, no fetch
  refetch: (info?: R) => T | Promise<T> | undefined | null; // re-run fetcher
};
```

### Options

```ts
type ResourceOptions<T, S = unknown> = {
  initialValue?: T;        // start in "ready" state with this value (skips initial undefined)
  name?: string;           // debug label (devtools)
  deferStream?: boolean;   // SSR: wait for this resource before flushing the stream
  ssrLoadFrom?: "initial" | "server"; // hydration source; "initial" uses initialValue, skips server fetch
  storage?: (init: T | undefined) => [Accessor<T | undefined>, Setter<T | undefined>]; // custom store (e.g. createStore)
  onHydrated?: (k: S | undefined, info: { value: T | undefined }) => void; // run after hydration
};
```

### Resource accessor properties

The first tuple element is a **callable** accessor with extra properties:

| State          | `()` returns | `.loading` | `.error`    | `.latest`     |
| -------------- | ------------ | ---------- | ----------- | ------------- |
| `"unresolved"` | `undefined`  | `false`    | `undefined` | `undefined`   |
| `"pending"`    | `undefined`  | `true`     | `undefined` | `undefined`   |
| `"ready"`      | `T`          | `false`    | `undefined` | `T`           |
| `"refreshing"` | `T`*         | `true`     | `undefined` | `T` (prev)    |
| `"errored"`    | throws       | `false`    | the error   | `never`       |

- **`resource()`** — current value. Reading it inside Suspense/transition tracking triggers the boundary while pending. In `"errored"` state, calling it **re-throws** the error (caught by `<ErrorBoundary>`).
- **`resource.loading`** — `true` while fetching (pending or refreshing). Reading it does **not** trigger Suspense, so it's safe for inline spinners.
- **`resource.error`** — the thrown error, or `undefined`. Reading it does not re-throw.
- **`resource.latest`** — last successfully resolved value; during a refetch it holds the **previous** value instead of going `undefined`. Great for "show stale data while refreshing".
- **`resource.state`** — the string state from the table above.

### Source behavior (re-triggering & skipping fetch)

The `source` is read reactively **before** the fetcher runs. If it resolves to `undefined`, `null`, or `false`, the **fetcher is not called** and the resource stays `unresolved`. Any other change re-runs the fetcher with the new value.

```tsx
import { createResource, createSignal } from "solid-js";

const [userId, setUserId] = createSignal<number | undefined>();

const [user] = createResource(userId, async (id) => {
  // Only runs once `userId` is a truthy value. `id` is narrowed to number.
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

setUserId(1); // now the fetcher fires; setting it again refetches
```

> Combine multiple dependencies into one object source so the fetcher re-runs when *any* change. Return falsy to gate fetching:
> ```tsx
> const [data] = createResource(
>   () => (ready() ? { q: query(), page: page() } : false),
>   ({ q, page }) => api.search(q, page)
> );
> ```

### refetch and mutate

```tsx
import { createResource } from "solid-js";

const [posts, { refetch, mutate }] = createResource(fetchPosts);

await refetch();              // re-run fetcher; info.refetching === true
await refetch("force");       // info.refetching === "force"

mutate((prev) => [...(prev ?? []), newPost]); // local update, no network call
```

---

## Suspense

Renders `fallback` while any suspense-tracked async dependency read **inside** it is pending.

```ts
import { Suspense } from "solid-js";

function Suspense(props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}): JSX.Element;
```

A boundary is triggered by **reading a pending resource's value** (`resource()`) somewhere in its subtree. `resource.loading`/`resource.error` do **not** trigger it.

```tsx
import { createResource, Suspense } from "solid-js";

function AsyncMessage() {
  const [message] = createResource(fetchMessage);
  return <p>{message()}</p>; // reading message() suspends while pending
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AsyncMessage />
    </Suspense>
  );
}
```

Boundaries nest — each pending read is handled by its **nearest** enclosing `<Suspense>`:

```tsx
<Suspense fallback={<div>Loading page...</div>}>
  <Title />
  <Suspense fallback={<div>Loading details...</div>}>
    <Details />
  </Suspense>
</Suspense>
```

> `<Suspense>` keeps already-rendered DOM mounted (just hidden) while showing the fallback, unlike `<Show>` which unmounts. Use `<Show when={!data.loading}>` when you want to *replace* content based on a plain boolean instead of suspending.

---

## SuspenseList (experimental)

Coordinates the reveal order of several sibling `<Suspense>` boundaries to reduce layout jank. Experimental; limited SSR support.

```ts
import { SuspenseList } from "solid-js";

function SuspenseList(props: {
  children: JSX.Element;
  revealOrder: "forwards" | "backwards" | "together";
  tail?: "collapsed" | "hidden";
}): JSX.Element;
```

- **`revealOrder`** — `"forwards"` (top→bottom, each item waits for the previous), `"backwards"` (bottom→top), `"together"` (reveal all at once when all are ready).
- **`tail`** — fallback visibility for not-yet-revealed items: default shows all fallbacks; `"collapsed"` shows only the next pending fallback; `"hidden"` shows none.

```tsx
<SuspenseList revealOrder="forwards" tail="collapsed">
  <Suspense fallback={<h2>Loading profile...</h2>}>
    <ProfileDetails />
  </Suspense>
  <Suspense fallback={<h2>Loading posts...</h2>}>
    <ProfileTimeline />
  </Suspense>
</SuspenseList>
```

---

## useTransition

Wraps async state updates so the **old UI stays visible** (no fallback flash) until the new async work resolves, while exposing a pending flag.

```ts
import { useTransition } from "solid-js";

function useTransition(): [
  pending: () => boolean,        // accessor: true while the transition is in flight
  start: (fn: () => void) => Promise<void>
];
```

```tsx
import { createResource, createSignal, Suspense, useTransition } from "solid-js";

function Example() {
  const [userId, setUserId] = createSignal(1);
  const [user] = createResource(userId, async (id) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  });
  const [pending, start] = useTransition();

  return (
    <>
      <button onClick={() => start(() => setUserId((id) => id + 1))}>
        Load next user
      </button>
      <div>{pending() ? "Loading transition..." : "Ready"}</div>
      <Suspense fallback={<p>Loading user...</p>}>
        <pre>{JSON.stringify(user(), null, 2)}</pre>
      </Suspense>
    </>
  );
}
```

Because the update is in a transition, the already-rendered `<pre>` stays on screen (showing the previous user) instead of being replaced by the fallback; `pending()` drives an inline indicator.

---

## startTransition

Same transition behavior as `useTransition` but without a pending accessor. Returns a `Promise` that resolves when the transition's async work completes.

```ts
import { startTransition } from "solid-js";

function startTransition(fn: () => unknown): Promise<void>;
```

```tsx
import { createResource, createSignal, Suspense, startTransition } from "solid-js";

const [userId, setUserId] = createSignal(1);
const [user] = createResource(userId, (id) => fetch(`/api/users/${id}`).then((r) => r.json()));

async function showNextUser() {
  await startTransition(() => setUserId(2));
  // resolves once the user resource (and any other suspended reads) settle
}
```

On the client the update runs as an async microtask; on the server it runs synchronously. Nested `startTransition` calls join the currently active transition.

---

## createDeferred

Creates a read-only signal that lags behind `source`, only updating when the browser is idle (or after `timeoutMs`). Use it to keep an expensive/low-priority view from blocking urgent updates.

```ts
import { createDeferred } from "solid-js";

function createDeferred<T>(
  source: Accessor<T>,
  options?: DeferredOptions<T>
): Accessor<T>;

interface DeferredOptions<T> {
  timeoutMs?: number;                          // force an update after this many ms
  equals?: false | ((prev: T, next: T) => boolean);
  name?: string;
}
```

```tsx
import { createDeferred, createSignal } from "solid-js";

const [text, setText] = createSignal("");
const deferredText = createDeferred(text, { timeoutMs: 500 });

// text() updates the input immediately (responsive);
// deferredText() drives an expensive filtered list that can lag slightly.
```

---

## Patterns

### Data fetching with loading + error UI

```tsx
import { createResource, ErrorBoundary, Suspense } from "solid-js";

function Profile(props: { id: number }) {
  const [user] = createResource(() => props.id, (id) =>
    fetch(`/api/users/${id}`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
  );

  return (
    <ErrorBoundary fallback={(err) => <p>Error: {err.message}</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <h1>{user()?.name}</h1>
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Dependent (chained) resources

Drive a second resource's source from the first resource's value. The source function returns falsy until the parent is ready, so the child fetch is gated automatically.

```tsx
const [user] = createResource(userId, fetchUser);
const [repos] = createResource(
  () => user()?.id,            // undefined until user resolves -> child fetch skipped
  (id) => fetch(`/api/users/${id}/repos`).then((r) => r.json())
);
```

### Optimistic update with mutate + rollback

```tsx
const [todos, { mutate, refetch }] = createResource(fetchTodos);

async function toggle(id: string) {
  const prev = todos();
  mutate((list) => list?.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); // optimistic
  try {
    await api.toggleTodo(id);
    refetch(); // reconcile with server truth
  } catch {
    mutate(prev); // rollback on failure
  }
}
```

### Show stale data while refreshing

```tsx
const [data, { refetch }] = createResource(query, search);

return (
  <div>
    <Show when={data.loading}><Spinner /></Show>
    {/* data.latest keeps the previous results during a refetch */}
    <For each={data.latest}>{(row) => <Row {...row} />}</For>
  </div>
);
```

### GraphQL / REST integration

A resource is just `source -> Promise<T>`; any client works. Return falsy from the source to gate the request.

```tsx
// GraphQL (e.g. graphql-request)
const [data] = createResource(
  () => ({ first: pageSize(), after: cursor() }),
  (vars) => gqlClient.request(LIST_QUERY, vars)
);

// REST
const [items] = createResource(
  () => filters(),
  (f) => fetch(`/api/items?${new URLSearchParams(f)}`).then((r) => r.json())
);
```

> For pagination/infinite scroll, read `info.value` (the previous result) inside the fetcher and merge: `(page, { value }) => [...(value ?? []), ...await fetchPage(page)]`.

---

## How this differs from React Query

Solid's resources are **built-in reactive primitives**, not a third-party caching layer. Key differences:

- **No cache by default.** `createResource` does not deduplicate, cache by key, or share across components. Each `createResource` call is its own piece of state. (For caching/dedupe across the app, use `cache`/`query` from `@solidjs/router`, or a library.)
- **Reactivity-driven refetch.** Refetch happens because the **source signal changed**, not because of a string query key. Dependent queries are expressed by deriving one source from another resource's value.
- **First-class Suspense/transition integration.** Reading `resource()` suspends the nearest boundary; transitions hold the old view — no `keepPreviousData`/`placeholderData` config needed (`resource.latest` gives that for free).
- **Granular, no re-renders.** Updates are fine-grained signal updates, so there's no component re-render / `useMemo` selector concern.
- **Manual control.** `mutate` (optimistic local set) and `refetch` are explicit functions; there is no built-in `invalidateQueries`, background polling, or `staleTime` — wire those up yourself (e.g. an interval calling `refetch`).
