# @solidjs/router

The official universal router for SolidJS — client/SSR/hash/memory routing with a modern data layer (`query`/`createAsync`/`action`).

> **Version targeted:** `@solidjs/router` v0.13+ through the current **0.16.x** (the data-API era). The data APIs below — `query()`, `createAsync()`, `createAsyncStore()`, `action()`, `useSubmission()` — are the modern, preferred way to load and mutate data. Older `data` functions and `useRouteData` (pre-0.10) are deprecated; do not use them. Install with `npm i @solidjs/router solid-js`.

---

## Setup: Router & Route

The `<Router>` wraps the app. Routes can be declared as JSX `<Route>` children or as a config array. Render once at the app root.

```tsx
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import Users from "./pages/Users";

render(
  () => (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/users" component={Users} />
    </Router>
  ),
  document.getElementById("app")!
);
```

### Root layout (`root` prop)

A `root` component persists across all navigations (good for shells/nav bars). It receives `props.children` as the matched route outlet.

```tsx
import { Router, Route } from "@solidjs/router";
import type { RouteSectionProps } from "@solidjs/router";

function App(props: RouteSectionProps) {
  return (
    <>
      <h1>My Site</h1>
      <nav>{/* ... */}</nav>
      {props.children}
    </>
  );
}

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/users" component={Users} />
    </Router>
  ),
  document.getElementById("app")!
);
```

### Base path

```tsx
<Router base="/app">
  <Route path="/" component={Home} /> {/* matches /app/ */}
</Router>
```

### Router variants

```tsx
import { Router, HashRouter, MemoryRouter } from "@solidjs/router";

<Router />        // standard history (pushState) routing
<HashRouter />    // hash-based (#/path) — no server config needed
<MemoryRouter />  // in-memory — for tests / non-DOM environments

// SSR: pass the request URL on the server, "" in the browser
import { isServer } from "solid-js/web";
<Router url={isServer ? req.url : ""} />
```

> **SPA deploy note:** Without SSR, configure hosting to rewrite all unmatched paths to `index.html` (Netlify `_redirects`: `/*  /index.html  200`; Vercel `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`).

---

## Nested routes & layouts

Nest `<Route>` elements; the parent component renders `props.children` as the outlet for matched children.

```tsx
<Route path="/users" component={UsersLayout}>
  <Route path="/" component={UsersList} />     {/* /users */}
  <Route path="/:id" component={User} />        {/* /users/:id */}
</Route>
```

```tsx
function UsersLayout(props: RouteSectionProps) {
  return (
    <div>
      <h1>We love our users!</h1>
      {props.children}
    </div>
  );
}
```

### Layout route without a path (route groups)

A `<Route>` with no `path` (or empty path) acts as a layout/group wrapper without adding a URL segment.

```tsx
<Route component={AuthedLayout}>
  <Route path="/dashboard" component={Dashboard} />
  <Route path="/settings" component={Settings} />
</Route>
```

---

## Config object form

Instead of JSX, pass a route definition array (or nested array) to `<Router>`. Combine with `lazy()` for code-splitting.

```tsx
import { lazy } from "solid-js";
import { Router, type RouteDefinition } from "@solidjs/router";

const routes: RouteDefinition[] = [
  { path: "/", component: lazy(() => import("./pages/Home")) },
  {
    path: "/users",
    component: lazy(() => import("./pages/UsersLayout")),
    children: [
      { path: "/", component: lazy(() => import("./pages/UsersList")) },
      { path: "/:id", component: lazy(() => import("./pages/User")), preload: preloadUser },
    ],
  },
  { path: "*404", component: lazy(() => import("./pages/NotFound")) },
];

render(() => <Router>{routes}</Router>, document.getElementById("app")!);
```

---

## Route matching syntax

```tsx
<Route path="/users/:id" component={User} />          // dynamic param  -> params.id
<Route path="/stories/:id?" component={Stories} />     // optional param
<Route path="foo/*" component={Foo} />                 // wildcard / catch-all (unnamed)
<Route path="foo/*any" component={Foo} />              // named splat   -> params.any
<Route path="*404" component={NotFound} />             // top-level 404 catch-all
<Route path={["login", "register"]} component={Login} /> // multiple paths, no re-render between them
```

### Match filters

Validate params; non-matching URLs fall through to other routes (e.g. the 404).

```tsx
import type { MatchFilters } from "@solidjs/router";

const filters: MatchFilters = {
  parent: ["mom", "dad"],                 // enum: only these values
  id: /^\d+$/,                             // regex
  withHtmlExtension: (v: string) => v.length > 5 && v.endsWith(".html"), // predicate
};

<Route
  path="/users/:parent/:id/:withHtmlExtension"
  component={User}
  matchFilters={filters}
/>
```

---

## Links: `<A>` and `<Navigate>`

```tsx
import { A, Navigate } from "@solidjs/router";

<A href="/users" activeClass="active" inactiveClass="inactive" end>
  Users
</A>;

// Programmatic redirect rendered as a component
<Route path="/old" component={() => <Navigate href="/new" />} />;
```

**`<A>` props:** `href` (resolved relative to the current route), `activeClass`, `inactiveClass`, `end` (exact match only — prevents matching descendant routes), `noScroll` (disable scroll-to-top), `replace` (no history entry), `state` (push value onto history stack).

---

## Route params & query string

### `useParams` — dynamic segments

```tsx
import { useParams } from "@solidjs/router";

function User() {
  const params = useParams(); // reactive: { id: string }
  const user = createAsync(() => getUser(params.id));
  return <h1>{user()?.name}</h1>;
}
```

### `useSearchParams` — query string

Returns `[readObject, setter]`. Values are strings; setting a key to `""`, `undefined`, or `null` removes it.

```tsx
import { useSearchParams } from "@solidjs/router";

const [searchParams, setSearchParams] = useSearchParams<{ page: string }>();

<span>Page: {searchParams.page}</span>;
<button onClick={() => setSearchParams({ page: (parseInt(searchParams.page) || 0) + 1 })}>
  Next Page
</button>;
// setter accepts navigate() options (scroll defaults to off here)
setSearchParams({ q: "abc" }, { replace: true });
```

---

## Navigation & location primitives

```tsx
import {
  useNavigate, useLocation, useMatch, useIsRouting, useCurrentMatches,
} from "@solidjs/router";

// Programmatic navigation
const navigate = useNavigate();
navigate("/login", { replace: true, scroll: false, state: { from: "/x" } });

// Reactive location: { pathname, search, hash, query, state, key }
const location = useLocation();
const path = createMemo(() => location.pathname);

// Does a path match the current route? (returns accessor -> match | undefined)
const match = useMatch(() => "/users");
<div classList={{ active: Boolean(match()) }} />;

// True during async route transitions — useful for global loading UI
const isRouting = useIsRouting();
<div classList={{ "grey-out": isRouting() }}><Content /></div>;

// All matched route entries (for breadcrumbs etc.)
const matches = useCurrentMatches();
const crumbs = createMemo(() => matches().map((m) => m.route.info?.breadcrumb));
```

### Navigation guards: `useBeforeLeave`

```tsx
import { useBeforeLeave, type BeforeLeaveEventArgs } from "@solidjs/router";

useBeforeLeave((e: BeforeLeaveEventArgs) => {
  if (form.isDirty && !e.defaultPrevented) {
    e.preventDefault();
    if (window.confirm("Discard unsaved changes - are you sure?")) {
      e.retry(true); // proceed with the original navigation
    }
  }
});
```

---

## Lazy routes / code splitting

Use Solid's `lazy()` to load route components on demand.

```tsx
import { lazy } from "solid-js";
const Users = lazy(() => import("./pages/Users"));

<Route path="/users" component={Users} />;
```

---

## Data loading: `query()`, `createAsync`, preload

This is the **modern data layer**. Pattern: wrap fetches in `query()`, read them with `createAsync()` inside components, and trigger them early via a `preload` function on the route.

### `query()` — cached, deduped async function

```tsx
import { query } from "@solidjs/router";

const getUser = query(async (id: string) => {
  return (await fetch(`/api/users/${id}`)).json();
}, "users"); // second arg = unique cache key
```

`query()` gives you: server-side dedup for the request lifetime, a ~5s browser preload cache, reactive refetch keyed by arguments, and up to 5 min back/forward navigation cache. Cache-key helpers for invalidation:

```ts
getUser.key;        // "users"
getUser.keyFor(id); // "users[5]"  — key + serialized args
```

### `createAsync()` — read a query reactively

A light wrapper over `createResource` (intended as a stand-in for a future Solid core primitive). Wrap reads in `<Suspense>` / `<ErrorBoundary>`.

```tsx
import { createAsync } from "@solidjs/router";

function User() {
  const params = useParams();
  const user = createAsync((prev) => getUser(params.id)); // prev = previous value
  return <h1>{user()?.name}</h1>;   // user() is undefined until resolved
}
```

```tsx
// .latest avoids suspending again on refetch (will be removed in a future version)
return <h1>{user.latest?.name}</h1>;
```

### `createAsyncStore()` — deeply reactive variant

Same as `createAsync`, but backed by a store for fine-grained updates to large data.

```tsx
import { createAsyncStore } from "@solidjs/router";
const todos = createAsyncStore(() => getTodos());
```

### `preload` functions — fetch in parallel / on hover

Called when the route loads, and eagerly when its `<A>` links are hovered. Kick off (`void`) the matching `query()` so the data is warm by the time the component reads it.

```tsx
import type { RoutePreloadFuncArgs } from "@solidjs/router";

function preloadUser({ params, location, intent }: RoutePreloadFuncArgs) {
  void getUser(params.id);
}

<Route path="/users/:id" component={User} preload={preloadUser} />;
```

`intent` is one of `"initial" | "navigate" | "native" | "preload"`. The function's return value is passed to the component (as `props.data`) for intents other than `"preload"`.

### Cache invalidation: `revalidate` / `reload`

```tsx
import { revalidate, reload } from "@solidjs/router";

await revalidate(getUser.keyFor(id));   // refetch one entry
await revalidate(getUser.key);          // refetch all entries for a query
await revalidate();                     // refetch everything

// reload(): like revalidate but as an action/response result
reload({ revalidate: getTodo.keyFor(todo.id) });
```

---

## Mutations: `action()`, `useSubmission`, `useAction`

`action()` wraps a mutation. Wired to a `<form action={...}>` it works with progressive enhancement (functions before JS hydrates).

```tsx
import { action, redirect } from "@solidjs/router";

const myAction = action(async (data: FormData) => {
  await doMutation(data);
  // redirect + revalidate the affected query in one step
  throw redirect("/", { revalidate: getUser.keyFor(data.get("id") as string) });
}, "my-action"); // optional 2nd arg = action name

// Form usage (data arrives as FormData)
<form action={myAction} method="post" />;
```

### Binding arguments with `.with()`

```tsx
const deleteTodo = action(api.deleteTodo);

<form action={deleteTodo.with(todo.id)} method="post">
  <button type="submit">Delete</button>
</form>;
```

### `useAction` — invoke outside a form (typed args)

```tsx
import { useAction } from "@solidjs/router";

const submit = useAction(myAction);
await submit(payload); // preserves the action's argument/return types
```

### `useSubmission` / `useSubmissions` — track in-flight state (optimistic UI)

```tsx
import { useSubmission, useSubmissions } from "@solidjs/router";

type Submission<T, U> = {
  readonly input: T;
  readonly result?: U;
  readonly pending: boolean;
  readonly url: string;
  clear: () => void;
  retry: () => void;
};

// single most-recent submission of an action (optional filter on input)
const submission = useSubmission(myAction, (input) => input[0] === todo.id);
<button disabled={submission.pending}>Save</button>;

// all in-flight submissions (e.g. render optimistic list items)
const submissions = useSubmissions(myAction, (input) => filter(input));
```

---

## Response helpers (`redirect` / `reload`)

Throw `redirect` from queries or actions to navigate; both accept a `revalidate` option to refresh cached queries.

```tsx
import { redirect } from "@solidjs/router";

const getUser = query(async () => {
  const user = await api.getCurrentUser();
  if (!user) throw redirect("/login");
  return user;
}, "current-user");
```

---

## Quick reference

| API | Purpose |
|-----|---------|
| `Router`, `HashRouter`, `MemoryRouter` | App-level router (history / hash / in-memory) |
| `Route` | Declare a route (path, component, preload, matchFilters, children) |
| `A`, `Navigate` | Declarative link / imperative redirect component |
| `useParams` | Reactive dynamic route params |
| `useSearchParams` | `[read, set]` for query string |
| `useNavigate` | Programmatic navigation |
| `useLocation` | Reactive `{ pathname, search, hash, query, state, key }` |
| `useMatch` | Accessor: does a path match the current route |
| `useIsRouting` | Boolean accessor true during transitions |
| `useCurrentMatches` | All matched route entries |
| `useBeforeLeave` | Navigation guard |
| `query` | Cached/deduped async function (`.key`, `.keyFor`) |
| `createAsync` / `createAsyncStore` | Read a query reactively (resource / store) |
| `action` | Define a mutation (`.with()` to bind args) |
| `useAction` | Invoke an action programmatically |
| `useSubmission` / `useSubmissions` | Track in-flight action state |
| `revalidate` / `reload` | Invalidate / refetch cached queries |
| `redirect` | Throwable navigation response |

---

## Sources

- [Solid Router docs](https://docs.solidjs.com/solid-router)
- [solidjs/solid-router on GitHub](https://github.com/solidjs/solid-router)
- [@solidjs/router on npm](https://www.npmjs.com/package/@solidjs/router)
