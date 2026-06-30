# SolidJS Control Flow Components (Solid 1.x)

Solid's built-in control flow components (`<Show>`, `<For>`, `<Index>`, `<Switch>`/`<Match>`, `<Dynamic>`, `<Portal>`, `<ErrorBoundary>`) give fine-grained, surgical DOM updates — use them instead of plain JS ternaries/`.map()` so the framework can update the right nodes without recreating the DOM.

> Applies to Solid 1.x. `<Show>`, `<For>`, `<Index>`, `<Switch>`, `<Match>`, `<ErrorBoundary>` import from `solid-js`. `<Dynamic>` and `<Portal>` import from `solid-js/web`.

---

## Why NOT plain ternaries / `.map()` for dynamic content

In React, JSX re-runs top to bottom on every render, so `cond ? <A/> : <B/>` and `list.map(...)` are normal. **Solid is different**: a component function runs **once**. JSX expressions are reactive, but a raw ternary or `.map()` placed in JSX has important downsides:

- **`array.map()`** has no concept of item identity. When the source array changes, Solid cannot tell which items moved/changed, so it **tears down and recreates every DOM node** in the list on each change. This loses element state (focus, scroll, uncontrolled input values, CSS transitions) and is slow for large lists. Use `<For>` (keyed by reference) or `<Index>` (keyed by index) so Solid reconciles instead of recreating.
- **A ternary** `when() ? <A/> : <B/>` works for small toggles, but it re-evaluates and swaps the whole branch whenever any signal it reads changes, and it gives you no `fallback`/`keyed`/narrowing ergonomics. `<Show>` only re-creates the block when the **truthiness** of `when` flips (not on every truthy→truthy change), and offers the callback form for safe non-null narrowing.

Rule of thumb: **any list goes through `<For>`/`<Index>`; any non-trivial conditional goes through `<Show>` or `<Switch>`/`<Match>`.**

```tsx
// ❌ Recreates all <li> nodes on every change to todos()
<ul>{todos().map((t) => <li>{t.text}</li>)}</ul>

// ✅ Reconciles by item identity, only touches what changed
<ul><For each={todos()}>{(t) => <li>{t.text}</li>}</For></ul>
```

---

## `<Show>`

Renders `children` when `when` is truthy, otherwise `fallback`.

```ts
import { Show } from "solid-js";

// non-keyed: function child receives an Accessor<NonNullable<T>>
function Show<T>(props: {
  when: T | undefined | null | false;
  keyed?: false;
  fallback?: JSX.Element;
  children: JSX.Element | ((item: Accessor<NonNullable<T>>) => JSX.Element);
}): JSX.Element;

// keyed: function child receives the value directly
function Show<T>(props: {
  when: T | undefined | null | false;
  keyed: true;
  fallback?: JSX.Element;
  children: JSX.Element | ((item: NonNullable<T>) => JSX.Element);
}): JSX.Element;
```

Key behavior:
- Non-keyed (default): the child block is only re-created when the **truthiness** of `when` changes. Swapping one truthy value for another truthy value does **not** recreate the block.
- `keyed={true}`: any change to the `when` value re-creates the block, even truthy→truthy.
- Function children are wrapped in `untrack`.

```tsx
// Basic + fallback
<Show when={!loading()} fallback={<div>Loading...</div>}>
  <div>Loaded</div>
</Show>

// Callback form for narrowing: `user` is an Accessor<NonNullable<T>>.
// Only valid to call while the condition is truthy.
<Show when={user()}>
  {(user) => <div>{user().name}</div>}
</Show>

// keyed: callback receives the value directly (not an accessor)
<Show when={user()} keyed>
  {(user) => <div>{user.name}</div>}
</Show>
```

The callback form is the idiomatic way to satisfy TypeScript when `when` may be `null`/`undefined` — inside the callback the value is `NonNullable<T>`.

---

## `<For>` vs `<Index>` — pick the right one (common mistake)

Both iterate an array. The difference is **what is keyed (reconciliation strategy)** and **which argument is reactive**.

| | `<For>` | `<Index>` |
|---|---|---|
| Keyed by | **item reference / value identity** | **array index** |
| `item` argument | `T[number]` (a plain value) | `Accessor<T[number]>` (call it: `item()`) |
| `index` argument | `Accessor<number>` (call it: `index()`) | `number` (plain) |
| On reorder | moves the existing DOM node | keeps DOM at the index, updates `item()` |
| On value-at-index change | replaces that row's node | updates in place via `item()` |
| Internally uses | `mapArray` | `indexArray` |

```ts
import { For, Index } from "solid-js";

function For<T extends readonly any[], U extends JSX.Element>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: T[number], index: Accessor<number>) => U;
}): JSX.Element;

function Index<T extends readonly any[], U extends JSX.Element>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: Accessor<T[number]>, index: number) => U;
}): JSX.Element;
```

Note the **swap**: in `<For>` the *item* is the plain value and the *index* is the accessor; in `<Index>` the *item* is the accessor and the *index* is a plain number.

```tsx
// <For>: item is a value, index() is a signal
<For each={items()} fallback={<div>No items</div>}>
  {(item, index) => <div>#{index()} {item.name}</div>}
</For>

// <Index>: item() is a signal, index is a number
<Index each={items()} fallback={<div>No items</div>}>
  {(item, index) => <div>#{index} {item().name}</div>}
</Index>
```

### When to use which

- **Use `<For>`** for lists of **objects/rows whose identity matters** and that can be **reordered, inserted, or removed** (todo lists, fetched records, sortable tables). Keying by reference means a moved item keeps its DOM node and local state.
- **Use `<Index>`** when **position is stable but the value at each position changes**, or for **primitives** (strings/numbers) where reference identity is meaningless. Classic case: a list of `<input>`s bound to a `string[]`. With `<For>`, editing a string produces a new reference and recreates the input (losing focus); with `<Index>` the row stays put and `item()` simply updates.

```tsx
// Editing primitives → use <Index> so inputs don't get recreated on each keystroke
<Index each={names()}>
  {(name, i) => (
    <input
      value={name()}
      onInput={(e) => setNames((p) => p.map((n, idx) => (idx === i ? e.currentTarget.value : n)))}
    />
  )}
</Index>
```

Quick heuristic: **array of objects that move around → `<For>`. Array of primitives, or fixed-length list of changing values → `<Index>`.**

---

## `<Switch>` / `<Match>`

Renders the **first** `<Match>` whose `when` is truthy; otherwise the `<Switch>` `fallback`. Use instead of chained ternaries / `<Show>` nesting.

```ts
import { Switch, Match } from "solid-js";

function Switch(props: { fallback?: JSX.Element; children: JSX.Element }): JSX.Element;

function Match<T>(props: {
  when: T | undefined | null | false;
  keyed?: false; // or keyed: true (callback then receives the value directly)
  children: JSX.Element | ((item: Accessor<NonNullable<T>>) => JSX.Element);
}): JSX.Element;
```

`<Match>` supports the same `keyed` flag and callback-narrowing form as `<Show>`.

```tsx
import { createSignal, Switch, Match } from "solid-js";

const [status, setStatus] = createSignal<"loading" | "success" | "error">("loading");

<Switch fallback={<p>Unknown status</p>}>
  <Match when={status() === "loading"}><p>Loading...</p></Match>
  <Match when={status() === "success"}><p>Saved</p></Match>
  <Match when={status() === "error"}><p>Failed</p></Match>
</Switch>

// Callback narrowing inside a Match:
<Switch>
  <Match when={user()}>{(u) => <Profile user={u()} />}</Match>
</Switch>
```

---

## `<Dynamic>`

Renders a component or intrinsic element chosen at runtime; remaining props are forwarded. Import from `solid-js/web`.

```ts
import { Dynamic } from "solid-js/web";

type ValidComponent = keyof JSX.IntrinsicElements | ((props: any) => JSX.Element);

function Dynamic<T extends ValidComponent>(
  props: { component: T | undefined } & ComponentProps<T>
): JSX.Element;
```

- `component` may be a component function, an intrinsic tag name string (e.g. `"div"`, `"h1"`), or `undefined` (renders nothing).
- All other props are passed straight to the rendered component/element.

```tsx
import { createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";

const views = {
  red: (p: { label: string }) => <p style={{ color: "red" }}>{p.label}</p>,
  blue: (p: { label: string }) => <p style={{ color: "blue" }}>{p.label}</p>,
};

const [selected, setSelected] = createSignal<keyof typeof views>("red");

<Dynamic component={views[selected()]} label="Selected view" />

// Intrinsic element by tag name:
<Dynamic component={"h1"} class="title">Hello</Dynamic>
```

Prefer `<Dynamic>` over a long `<Switch>` when you're selecting among many components keyed by a value.

---

## `<Portal>`

Renders children into a DOM node **outside** the parent DOM hierarchy (modals, tooltips, overlays) while keeping them in the Solid component tree — events still propagate through the Solid hierarchy. Import from `solid-js/web`.

```ts
import { Portal } from "solid-js/web";

function Portal(props: {
  mount?: Node;        // defaults to document.body
  useShadow?: boolean; // wrap container in a shadow root
  isSVG?: boolean;     // create a <g> container instead of <div>
  ref?: HTMLDivElement | SVGGElement | ((el: HTMLDivElement | SVGGElement) => void);
  children: JSX.Element;
}): Text;
```

- Without `mount`, mounts to `document.body`. A wrapper element (`<div>`, or `<g>` if `isSVG`) is created in the mount target — except when mounting to `document.head`, where children are inserted directly.
- Renders only on the client: produces no SSR output and is skipped during hydration.

```tsx
import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";

const [open, setOpen] = createSignal(false);

<Show when={open()}>
  <Portal>
    <div style={{ position: "fixed", top: 0, left: 0, background: "white" }}>
      <div>Popup</div>
      <button onClick={() => setOpen(false)}>Close</button>
    </div>
  </Portal>
</Show>
```

---

## `<ErrorBoundary>`

Catches errors thrown while **rendering JSX** or **updating reactive computations** in its subtree, and renders `fallback` instead.

```ts
import { ErrorBoundary } from "solid-js";

function ErrorBoundary(props: {
  fallback: JSX.Element | ((err: any, reset: () => void) => JSX.Element);
  children: JSX.Element;
}): JSX.Element;
```

- The function form of `fallback` receives `(err, reset)`. Calling `reset()` clears the error state and re-renders `children`.
- **Does NOT catch** errors thrown from event handlers or from callbacks scheduled outside Solid's render/update flow (e.g. raw `setTimeout`, unhandled promise rejections). Handle those manually.
- Errors thrown by the fallback itself bubble to a parent `<ErrorBoundary>`.

```tsx
import { ErrorBoundary } from "solid-js";

function ErrorProne() {
  throw new Error("Broken");
}

<ErrorBoundary
  fallback={(err, reset) => (
    <div>
      <p>{String(err)}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <ErrorProne />
</ErrorBoundary>
```

---

## Quick reference

| Component | Import | Use for |
|---|---|---|
| `<Show>` | `solid-js` | Single condition; use callback form to narrow nullable `when` |
| `<For>` | `solid-js` | Lists keyed by item reference; objects that reorder/insert/remove |
| `<Index>` | `solid-js` | Lists keyed by index; primitives or fixed positions with changing values |
| `<Switch>`/`<Match>` | `solid-js` | Mutually exclusive multi-way branching |
| `<Dynamic>` | `solid-js/web` | Render a component/tag chosen at runtime |
| `<Portal>` | `solid-js/web` | Render children outside the parent DOM (modals, tooltips) |
| `<ErrorBoundary>` | `solid-js` | Catch render/update errors; `fallback(err, reset)` |
