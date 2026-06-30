# SolidJS Reactivity Primitives (Solid 1.x)

Reference for Solid's fine-grained reactive primitives — signals, derivations, effects, and the utilities that control tracking, batching, and ownership. **This doc targets Solid 1.x.** Solid 2.0 changes (e.g. signal-options changes, new effect timing/APIs) are covered in a separate doc.

## Mental model

- Solid reactivity is **fine-grained and synchronous**, not a virtual DOM. There is no re-render of a component function — components run **once**; only the reactive computations re-run.
- A **signal** is the atomic reactive value: a getter (`Accessor<T>`) and a setter (`Setter<T>`).
- Reading a signal's getter **synchronously inside a tracking scope** subscribes that scope to the signal. The scope re-runs when the signal changes. There is no manual dependency list — dependencies are collected on every run.
- **Tracking scopes** are: `createEffect`, `createMemo`, `createComputed`, `createRenderEffect`, JSX expressions, and the `fn` of control-flow components (`<Show>`, `<For>`, etc.). Plain callbacks (event handlers, `setTimeout`, promises) are **not** tracking scopes.
- Derivations (`createMemo`) and effects (`createEffect`) are both computations; the difference is *purity* and *timing*. Memos compute a cached value during the pure phase; effects run side effects after render.
- Computations form an **ownership tree**. When an owner is disposed, its child computations and registered `onCleanup` callbacks are torn down. Every computation runs under an owner (`createRoot` establishes the top-level owner).

### Execution timing within one update cycle

```
synchronous setters / batch
        │
        ▼
  pure phase: createComputed  →  createMemo / createRenderEffect (interleaved by dependency order)
        │
        ▼
  render / DOM updates
        │
        ▼
  effect phase: createEffect   (after DOM is built, before browser paint)
```

`createComputed` runs first (pure, eager). `createMemo` and `createRenderEffect` run during the pure/render phase. `createEffect` is deferred to after render. Within the same cycle, effects always run *after* all memos they depend on have settled, so an effect never reads a stale memo.

---

## createSignal

```tsx
function createSignal<T>(): Signal<T | undefined>;
function createSignal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
// Signal<T> = [get: Accessor<T>, set: Setter<T>]
// Accessor<T> = () => T
// SignalOptions: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
```

The fundamental reactive value. Returns a `[getter, setter]` tuple.

- **Getter** `() => T`: returns the current value and, if called inside a tracking scope, subscribes that scope.
- **Setter**: either pass the next value directly, or pass a **function updater** `(prev) => next` to derive from the current value. Returns the new value.
- Setting a value that is `===` to the current value does **not** notify subscribers (default equality). Override with `equals`:
  - `equals: false` — always notify (useful when mutating the same object/array reference, or to force-trigger).
  - `equals: (prev, next) => boolean` — custom comparator; return `true` to treat as unchanged (no notify).
- Calling the setter with a function value: must wrap it (`setX(() => fn)`) — a bare function is interpreted as the updater form.

```tsx
import { createSignal } from "solid-js";

const [count, setCount] = createSignal(0);

count();                  // read (subscribes if in a tracking scope) -> 0
setCount(5);              // direct set
setCount((c) => c + 1);   // function updater -> 6

// Force notify even when reference is unchanged (e.g. mutated array):
const [list, setList] = createSignal<number[]>([], { equals: false });
setList((l) => { l.push(1); return l; });

// Storing a function value requires the updater wrapper:
const [handler, setHandler] = createSignal<() => void>();
setHandler(() => () => console.log("run"));
```

---

## createMemo

```tsx
function createMemo<T>(
  fn: (prev: T | undefined) => T,
  value?: T,
  options?: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): Accessor<T>;
```

A **read-only derived signal** with a cached value. `fn` is a tracking scope: it re-runs when any signal it reads changes, recomputing and caching the result. Reading the memo subscribes the caller, exactly like a signal getter.

- **Pure** — must not cause side effects; runs during the pure phase.
- Memoized: downstream consumers only re-run when the memo's *output* changes (subject to `equals`), not on every dependency change. This makes memos the tool for de-duping expensive work and breaking diamond/over-trigger problems.
- `fn` receives the previous computed value; `value` seeds the first `prev`.

```tsx
import { createSignal, createMemo } from "solid-js";

const [first, setFirst] = createSignal("Ada");
const [last, setLast] = createSignal("Lovelace");

const fullName = createMemo(() => `${first()} ${last()}`);

fullName(); // "Ada Lovelace" — recomputed only when first() or last() change

// previous-value accumulation:
const [n, setN] = createSignal(1);
const runningMax = createMemo((prev: number) => Math.max(prev, n()), 0);
```

---

## createEffect

```tsx
function createEffect<T>(
  fn: (prev: T | undefined) => T,
  value?: T,
  options?: { name?: string }
): void;
```

A tracking scope for **side effects** (DOM, logging, network, writing to non-reactive stores). Auto-tracks every signal/memo read synchronously inside `fn` and re-runs when any of them change.

- **Runs after the render phase** — on first run, after the component's DOM has been created (but before paint). Use this for code that needs the DOM to exist.
- Returns nothing reactive. `fn` receives its previous return value; `value` seeds the first `prev` (handy for diffing old vs new).
- Re-runs are **batched/deduped**: multiple synchronous changes trigger one re-run.
- Only **synchronous** reads are tracked. Reads inside `setTimeout`, `await` continuations, or event callbacks are *not* tracked.

```tsx
import { createSignal, createEffect } from "solid-js";

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log("count is", count()); // subscribes to count; re-runs on change
});

// Diffing previous vs current with the prev/value form:
createEffect((prev) => {
  const c = count();
  if (prev !== undefined) console.log(`${prev} -> ${c}`);
  return c;
}, count());
```

For "run once after mount" use `onMount(fn)` (an effect that doesn't track).

---

## createComputed

```tsx
function createComputed<T>(
  fn: (prev: T | undefined) => T,
  value?: T,
  options?: { name?: string }
): void;
```

A tracking computation that runs **immediately and eagerly, in the pure phase before render** — and re-runs synchronously before effects/render on dependency change.

- Use it to **write to other reactive primitives** (derive one signal from another) where you need the write to land *before* render and before effects observe it. Because it runs in the pure phase, it does not cause an extra render pass.
- Avoid for DOM or async side effects (use `createEffect`). Overuse couples computations tightly and can hurt performance; prefer `createMemo` for pure derived *reads*.

```tsx
import { createSignal, createComputed } from "solid-js";

const [source, setSource] = createSignal(1);
const [doubled, setDoubled] = createSignal(0);

// Keeps `doubled` synced before render, before any effect runs.
createComputed(() => setDoubled(source() * 2));
```

---

## createRenderEffect

```tsx
function createRenderEffect<T>(
  fn: (prev: T | undefined) => T,
  value?: T,
  options?: { name?: string }
): void;
```

Like `createEffect`, but runs **during the render phase** — synchronously as DOM elements are created/updated, *before* they are mounted/connected. Solid's own DOM bindings are render effects.

- First run is **synchronous at creation time** (interleaved with memos by dependency order), unlike `createEffect` whose first run is deferred until after render. After the first run it's scheduled like an effect.
- Use when you must touch DOM-related work that should happen as elements are built, before paint and before `createEffect` runs. For most app side effects, prefer `createEffect`.

```tsx
import { createSignal, createRenderEffect } from "solid-js";

const [color, setColor] = createSignal("red");
let el!: HTMLDivElement;

createRenderEffect(() => {
  // runs during render, before the element is connected/painted
  el.style.color = color();
});
```

---

## on() — explicit dependencies and defer

```tsx
function on<S, U>(
  deps: Accessor<S> | Array<Accessor<unknown>>,
  fn: (input: S, prevInput: S | undefined, prevValue: U | undefined) => U,
  options?: { defer?: boolean }
): (prevValue: U | undefined) => U;
```

Wraps an effect/memo body so dependencies are **explicit** (only `deps` are tracked) and the body runs **untracked**. Returns a function you pass to `createEffect` / `createMemo` / `createComputed`.

- `deps`: a single accessor or an array of accessors. Only these trigger re-runs; signals read inside `fn` are **not** tracked.
- `fn` receives the resolved dep value(s), the previous dep value(s), and the previous return value.
- `defer: true`: **skip the initial run**; only run on the first change after creation.

```tsx
import { createSignal, createEffect, on } from "solid-js";

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

// Re-runs only when `a` changes; reading b() here is NOT tracked.
createEffect(on(a, (av) => console.log("a changed", av, b())));

// Multiple deps + defer (won't fire on mount):
createEffect(on([a, b], ([av, bv]) => console.log(av, bv), { defer: true }));

// Equivalent desugaring of on(a, fn):
createEffect(() => {
  const v = a();
  untrack(() => fn(v));
});
```

---

## batch()

```tsx
function batch<T>(fn: () => T): T;
```

Defers downstream recomputation until `fn` completes, so multiple setter calls trigger dependents **once** instead of per-set. Returns `fn`'s value. (Setters inside Solid event handlers are already auto-batched; use `batch` for grouped updates outside that.)

```tsx
import { createSignal, batch, createEffect } from "solid-js";

const [x, setX] = createSignal(1);
const [y, setY] = createSignal(2);
createEffect(() => console.log("sum", x() + y()));

batch(() => {
  setX(10);
  setY(20);
}); // effect runs once with the final values, not twice
```

---

## untrack()

```tsx
function untrack<T>(fn: () => T): T;
```

Runs `fn` **without** subscribing the surrounding tracking scope to any signals read inside it. Use to read a value without depending on it.

```tsx
import { createSignal, createEffect, untrack } from "solid-js";

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

createEffect(() => {
  console.log(a(), untrack(b)); // re-runs only when a() changes, not b()
});
```

---

## createRoot() and disposal

```tsx
function createRoot<T>(fn: (dispose: () => void) => T, detachedOwner?: Owner): T;
```

Creates a **non-tracked owner scope that does not auto-dispose**. `fn` receives a `dispose` function; calling it tears down every computation and runs every `onCleanup` registered within the root.

- Needed when you create reactive computations **outside** a component (which already provides an owner) — e.g. in a library, a test, or a long-lived service — otherwise computations would have no owner and leak / warn.
- You are responsible for calling `dispose`.

```tsx
import { createRoot, createSignal, createEffect } from "solid-js";

const dispose = createRoot((dispose) => {
  const [n, setN] = createSignal(0);
  createEffect(() => console.log(n()));
  return dispose;
});

// later, tear everything down:
dispose();
```

---

## onCleanup()

```tsx
function onCleanup<T extends () => void>(fn: T): T;
```

Registers a callback that runs when the **enclosing owner is disposed** *or, inside a computation, before that computation re-runs*. This is the primary way to release resources (timers, subscriptions, listeners) tied to a reactive scope.

```tsx
import { createEffect, onCleanup, createSignal } from "solid-js";

const [id, setId] = createSignal(1);

createEffect(() => {
  const current = id();
  const timer = setInterval(() => console.log("poll", current), 1000);
  // runs before the next re-run (when id changes) and on disposal:
  onCleanup(() => clearInterval(timer));
});
```

---

## getOwner() / runWithOwner()

```tsx
function getOwner(): Owner | null;
function runWithOwner<T>(owner: Owner | null, fn: () => T): T | undefined;
```

`getOwner` returns the current owner. `runWithOwner` executes `fn` under a captured owner, restoring the tracking/ownership context. Essential when you must create reactive primitives **after an `await` or in a callback**, where the synchronous owner context has been lost (so cleanup and ownership still attach correctly).

```tsx
import { getOwner, runWithOwner, createEffect, onCleanup } from "solid-js";

const owner = getOwner();

setTimeout(() => {
  // Without runWithOwner, this effect would have no owner and not be cleaned up.
  runWithOwner(owner, () => {
    createEffect(() => {/* ... */});
    onCleanup(() => {/* tied to original owner */});
  });
}, 100);
```

---

## Common pitfalls

- **Destructuring props loses reactivity.** Props is a reactive proxy whose properties are getters. Destructuring (`const { value } = props`) reads the getter once, outside any tracking scope, so nothing re-subscribes. Access lazily instead:
  ```tsx
  // ❌ loses reactivity
  function Bad({ value }) { return <div>{value}</div>; }
  // ✅ keep accessing props.x, or alias via a thunk
  function Good(props) {
    const value = () => props.value;
    return <div>{props.value} {value()}</div>;
  }
  ```
  Use `splitProps(props, ["a", "b"])` to split while preserving reactivity, and `mergeProps(defaults, props)` to apply defaults without breaking it.

- **Reading a signal outside a tracking scope never subscribes.** Reads in plain callbacks, `setTimeout`, promise `.then`/`await` continuations, or module top-level are one-time reads. To react, read inside `createEffect`/`createMemo`/JSX.
  ```tsx
  setCount(5);
  setTimeout(() => console.log(count()), 0); // reads once, no subscription
  ```

- **Conditional reads only subscribe on runs where they execute.** A signal read inside an `if`/`&&`/early-return branch is tracked only when that branch runs. If the branch is skipped, the dependency is dropped — and re-added next time it runs. This is correct behavior, but means a computation may not react to a signal it "logically uses" if it was short-circuited.
  ```tsx
  createEffect(() => {
    if (enabled()) console.log(value()); // value() tracked only while enabled() is true
  });
  ```

- **Calling a getter where you meant to pass it.** `<Show when={count()}>` reads now; `count` (no call) passes the accessor. In JSX `{count()}` is correct (the JSX expr is a tracking scope); passing `count()` as a prop that expects an accessor is wrong.

- **Effects that write the signals they read can loop.** An effect that reads `a()` and also `setA(...)` re-triggers itself. Use `untrack` around the read, derive with `createMemo`, or restructure.

- **Mutating an object/array without changing the reference won't notify.** Default equality is `===`. Either set a new reference (`setItems([...items(), x])`), use `equals: false`, or use a Store (`createStore`) for fine-grained nested updates.

- **Creating computations without an owner leaks/warns.** Outside a component (tests, libraries, async callbacks), wrap in `createRoot` or restore context with `runWithOwner` so `onCleanup` and disposal work.

- **`createComputed` is rarely the right tool.** For derived *values* use `createMemo`; for side effects use `createEffect`. Reach for `createComputed` only when you specifically need an eager pure write before render.
