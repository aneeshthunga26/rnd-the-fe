# SolidJS: Components, Props, Lifecycle, Context & Refs

Reference for writing SolidJS **components, props, lifecycle, context, and refs** (Solid 1.x). All imports come from `solid-js` unless otherwise noted.

> ## ⚠️ Key difference from React: components run ONCE
>
> A Solid component function executes **exactly once**, when it is first rendered into the reactive tree — **not** on every state change. There is no re-render. After the first run, only the fine-grained reactive parts of the JSX (signal reads, `<Show>`, etc.) re-run when their dependencies change.
>
> Consequences you must internalize:
> - Plain code in the function body runs once. `console.log(count())` logs only the initial value.
> - **Never destructure `props`** — that reads the value once at run time and freezes it. Use `props.x`.
> - There is **no `onUpdate`**. Reactive work goes in `createEffect` / JSX, not in the body.
> - Conditional content goes **inside the returned JSX** (ternary / `<Show>`), never as `if` branches around different `return`s that depend on changing state.

---

## 1. Component basics

Components are functions returning JSX. **Names must start with a capital letter** or they are treated as HTML tags.

```tsx
function MyComponent() {
  return <div>Hello World</div>;
}

function App() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
```

Because the body runs once, setup (signals, stores, effects, event subscriptions) happens at the top of the function. The reactive JSX it returns is what stays "live":

```tsx
function Counter() {
  const [count, setCount] = createSignal(0);

  console.log(count()); // runs ONCE — logs 0, never again

  return (
    <div>
      <p>Count: {count()}</p> {/* this text node re-runs on change */}
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
    </div>
  );
}
```

Each instance is independent: its own signals, effects, and cleanup.

### Conditional rendering belongs in the return

Since the body runs once, branch **inside** the JSX, not with early `return`s tied to changing state.

```tsx
function MyComponent() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      {count() > 5 ? (
        <div>Count limit reached</div>
      ) : (
        <>
          <p>Count: {count()}</p>
          <button onClick={() => setCount((p) => p + 1)}>Increment</button>
        </>
      )}
    </div>
  );
}
```

Prefer the built-in `<Show>` control-flow component for readability:

```tsx
<Show when={count() > 5} fallback={<p>Count: {count()}</p>}>
  <div>Count limit reached</div>
</Show>
```

### Import / export

```tsx
// Named (preferred)
export function MyComponent() { return <div>Hello</div>; }
import { MyComponent } from "./MyComponent";

// Default
export default function MyComponent() { return <div>Hello</div>; }
import MyComponent from "./MyComponent";
```

---

## 2. Props are reactive proxies

`props` is a **read-only reactive proxy**. Reactivity lives in the *act of reading a property* (`props.name`), so the read must happen where you want it to stay live.

```tsx
function MyComponent(props) {
  return <div>Hello {props.name}</div>; // ✓ reactive read inside JSX
}
// <MyComponent name="Ryan Carniato" />
```

### ❌ Never destructure props

Destructuring (or assigning to a local) reads the value once and disconnects it from the proxy — it will not update.

```tsx
function MyComponent(props) {
  const { name } = props;        // ❌ breaks reactivity
  const name = props.name;       // ❌ also breaks reactivity
  const name = () => props.name; // ✓ wrap in a function; name() is always current
}
```

Rule of thumb: pass `props.x` directly into JSX, or wrap it in an arrow function / use the helpers below.

### `mergeProps` — defaults & merging

Like `Object.assign` but **lazy and reactive**: merges left → right, the last source with a non-`undefined` value for a key wins, and reads stay reactive. Use it to apply default prop values without destructuring.

```tsx
import { mergeProps } from "solid-js";

function Greeting(props) {
  const merged = mergeProps({ greeting: "Hello", name: "Smith" }, props);
  return (
    <div>
      {merged.greeting} {merged.name}
    </div>
  );
}
```

Notes: shallow merge; function sources are wrapped to keep reads reactive; properties resolve when read, not copied eagerly.

### `splitProps` — reactive "destructuring"

Splits one props object into reactive subsets plus a remainder, **without** breaking reactivity. Each key goes to the *first* group that lists it; the final returned object holds everything not named. This is the correct way to "destructure" and to forward leftover props.

```tsx
import { splitProps } from "solid-js";

function MyComponent(props) {
  const [local, others] = splitProps(props, ["children"]);
  return (
    <>
      <div>{local.children}</div>
      <Child {...others} /> {/* forward the rest, still reactive */}
    </>
  );
}
```

Multiple groups (returns one object per key array, plus a final remainder):

```tsx
const [vowels, consonants, leftovers] = splitProps(
  props,
  ["a", "e"],
  ["b", "c", "d"]
);
```

### `children()` helper

Reading `props.children` multiple times can re-create child elements and cause bugs. The `children` helper resolves children **once** into a stable, memoized accessor. Use it whenever you read/inspect/iterate children (e.g. library components, lists, wrappers).

```tsx
import { children } from "solid-js";

function ColoredList(props) {
  const resolved = children(() => props.children);
  return <>{resolved()}</>;
}
```

`resolved.toArray()` flattens nested arrays/fragments to an array (`[]` if null/undefined):

```tsx
function List(props) {
  const resolved = children(() => props.children);
  return (
    <ul>
      {resolved.toArray().map((child) => (
        <li>{child}</li>
      ))}
    </ul>
  );
}
```

---

## 3. Lifecycle: `onMount`, `onCleanup` (and why there's no `onUpdate`)

### `onMount` — run once after the initial render

Runs **once** on the client after first render; does **not** run during SSR; does **not** track reactive dependencies. By the time it runs, refs are already assigned. Use it for one-time browser setup and DOM/ref access.

```tsx
import { onMount } from "solid-js";

function MyComponent() {
  let ref: HTMLButtonElement;

  onMount(() => {
    ref.disabled = true; // refs are assigned by now
  });

  return <button ref={ref}>Focus me!</button>;
}
```

Internally `onMount(fn)` is equivalent to `createEffect(() => untrack(fn))`. Returning a function from `fn` does **not** register cleanup — use `onCleanup` for that.

> "Mounted" means mounted into the **reactive tree**, not necessarily inserted into the DOM. If you store JSX in a variable and render it later, `onMount` fires when that JSX is evaluated. For true DOM insertion/removal, use a `ref` callback or solid-primitives lifecycle helpers.

### `onCleanup` — dispose resources

Registers cleanup on the current reactive scope. In a component it runs on unmount; inside an effect/memo/root it runs when that scope is disposed **or re-executes**. Multiple cleanups are allowed. Calling it outside a reactive owner does nothing (dev warns).

```tsx
import { onCleanup } from "solid-js";

const Component = () => {
  const handleClick = () => console.log("clicked");
  document.addEventListener("click", handleClick);

  onCleanup(() => {
    document.removeEventListener("click", handleClick);
  });

  return <main>Listening for document clicks</main>;
};
```

`onCleanup` inside `createEffect` runs before each re-run — ideal for resubscribing:

```tsx
import { createEffect, createSignal, onCleanup } from "solid-js";

function Example() {
  const [topic, setTopic] = createSignal("news");
  createEffect(() => {
    const currentTopic = topic();
    console.log("subscribing to", currentTopic);
    onCleanup(() => console.log("cleaning up", currentTopic)); // before re-run / on dispose
  });
  return <button onClick={() => setTopic("sports")}>Change topic</button>;
}
```

### Why there is no `onUpdate`

Components don't re-render, so there is nothing to hook "after update" onto. To react to a value changing, use **`createEffect`** — it re-runs automatically whenever any signal it reads changes (and runs once initially):

```tsx
createEffect(() => {
  console.log("count changed to", count()); // runs on mount + every change to count()
});
```

That `createEffect` *is* your "onUpdate". (Use `on(count, fn, { defer: true })` if you want to skip the initial run.)

---

## 4. Refs

A `ref` gives direct access to a DOM element. Two forms:

### Variable assignment form

Declare a variable and pass it as `ref`. Assignment happens at **creation time, before** the element is added to the DOM. In TypeScript use a definite-assignment assertion (`!`) since Solid assigns it for you.

```tsx
function Component() {
  let myElement!: HTMLParagraphElement; // TS: definite assignment

  return (
    <div>
      <p ref={myElement}>My Element</p>
    </div>
  );
}
```

Access the element in `onMount` (it's assigned by then). It is `undefined` in the component body before render.

### Callback form

Use a callback when you need to run code as soon as the element is created (still before DOM insertion):

```tsx
<p
  ref={(el) => {
    myElement = el; // el created, not yet in the DOM
  }}
>
  My Element
</p>
```

### Refs to conditionally-rendered elements

A variable ref is only assigned when the element actually renders. With `<Show>`, the ref is assigned when the branch becomes visible:

```tsx
function App() {
  const [show, setShow] = createSignal(false);
  let element!: HTMLParagraphElement;

  return (
    <div>
      <button onClick={() => setShow((s) => !s)}>Toggle</button>
      <Show when={show()}>
        <p ref={element}>This is the ref element</p>
      </Show>
    </div>
  );
}
```

### Forwarding refs

There is no `forwardRef` in Solid. A parent passes `ref` like any prop; the child assigns `props.ref` to its element. **Solid always delivers `ref` to the child as a callback**, regardless of whether the parent passed a variable or a callback — just assign it through.

```tsx
// Parent
import { Canvas } from "./Canvas";

function ParentComponent() {
  let canvasRef!: HTMLCanvasElement;
  const animateCanvas = () => {
    // use canvasRef ...
  };
  return (
    <div>
      <Canvas ref={canvasRef} />
      <button onClick={animateCanvas}>Animate Canvas</button>
    </div>
  );
}

// Child — forward by assigning props.ref to the real element
function Canvas(props) {
  return (
    <div class="canvas-container">
      <canvas ref={props.ref} />
    </div>
  );
}
```

> Need multiple ref-like behaviors on one element, or reactive data passed in? Use a **directive** (`use:foo`) — a function `(element, accessor) => void` called at render time before DOM insertion.

---

## 5. Context

Context shares data down the tree without prop drilling. It's built on Solid's owner tree, not re-rendering.

### `createContext` / `Provider` / `useContext`

```tsx
import { createContext, useContext } from "solid-js";

// 1. Create — optional default value
const MyContext = createContext<string>();

// 2. Provide — value available to all descendants
const Provider = (props) => (
  <MyContext.Provider value="new value">{props.children}</MyContext.Provider>
);

// 3. Consume — reads the nearest matching Provider
const Child = () => {
  const value = useContext(MyContext);
  return <span>{value}</span>;
};

export const App = () => (
  <Provider>
    <Child />
  </Provider>
);
```

`useContext` returns the nearest provider's `value`; if there is no matching provider it returns the `defaultValue` (or `undefined` if none was given). A provider `value` of `undefined` is treated as missing.

### Default values & typing

`createContext` is overloaded:
- `createContext<T>()` → `Context<T | undefined>` (no default; `useContext` can return `undefined`).
- `createContext<T>(defaultValue: T)` → `Context<T>` (`useContext` always returns `T`).

```tsx
type Theme = "light" | "dark";
const ThemeContext = createContext<Theme>("light"); // useContext -> Theme (never undefined)
```

The `Context<T>` shape:

```ts
interface Context<T> {
  id: symbol;
  Provider: (props: { value: T; children: any }) => any;
  defaultValue: T;
}
```

### Custom provider + typed consumer hook (recommended pattern)

Wrap `useContext` in a helper that throws when the provider is missing. This narrows the type (removes `undefined`) and gives a clear runtime error.

```tsx
import { createSignal, createContext, useContext, type Accessor } from "solid-js";

type CounterValue = [
  Accessor<number>,
  { increment: () => void; decrement: () => void }
];

const CounterContext = createContext<CounterValue>();

export function CounterProvider(props: { initialCount?: number; children: any }) {
  const [count, setCount] = createSignal(props.initialCount ?? 0);
  const counter: CounterValue = [
    count,
    {
      increment: () => setCount((p) => p + 1),
      decrement: () => setCount((p) => p - 1),
    },
  ];
  return (
    <CounterContext.Provider value={counter}>
      {props.children}
    </CounterContext.Provider>
  );
}

// Typed consumer — throws if used outside a provider, narrows away `undefined`
export function useCounter() {
  const context = useContext(CounterContext);
  if (!context) throw new Error("useCounter must be used within a CounterProvider");
  return context;
}
```

Consume it:

```tsx
import { useCounter } from "./Counter";

export function Child() {
  const [count, { increment, decrement }] = useCounter();
  return (
    <>
      <div>{count()}</div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </>
  );
}
```

### Updating context values

To make context reactive, put a **signal (or store) into the `value`**. Because consumers read through the proxy/accessor, updates propagate to every consumer with no re-render. (Pass the signal getter or a store, not a plain snapshot.)

> HMR caveat: define each context in its own module and export it, so the context object stays stable across reloads. Recreating a context in a reloaded module yields a *new* object and consumers may fall back to the default.

---

## 6. `createUniqueId`

Generates a stable unique string for the current render/hydration context. Use for `id`/`for`/ARIA attributes. SSR-safe **only if called the same number of times on server and client** (counter-based) — don't gate it behind `isServer`/`<NoHydration>`. Not cryptographically secure; not unique across machines.

```tsx
import { createUniqueId } from "solid-js";

function Input(props: { id?: string; label: string }) {
  const inputId = props.id ?? createUniqueId();
  return (
    <>
      <label for={inputId}>{props.label}</label>
      <input id={inputId} />
    </>
  );
}
```

---

## 7. `lazy` — code splitting

Wraps a dynamic `import()` and returns a component that loads its module on demand. Pair with `<Suspense>` for a fallback (without one, it renders an empty string until loaded). The returned component also exposes `preload()`.

```tsx
import { lazy, Suspense } from "solid-js";

const ComponentA = lazy(() => import("./ComponentA"));

function App(props: { title: string }) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ComponentA title={props.title} />
    </Suspense>
  );
}
```

Preload eagerly (e.g. on hover) to avoid the loading delay later:

```tsx
import { createSignal, lazy, Show, Suspense } from "solid-js";

const Nested = lazy(() => import("./Nested"));

const ComponentWithPreload = () => {
  const [showNested, setShowNested] = createSignal(false);
  return (
    <div>
      <button
        onMouseEnter={() => Nested.preload()}
        onClick={() => setShowNested(true)}
      >
        Preload Nested Component
      </button>
      <Show when={showNested()}>
        <Suspense fallback={<p>Loading nested component...</p>}>
          <Nested />
        </Suspense>
      </Show>
    </div>
  );
};
```

The lazy module must export the component as its **`default`** export: `() => import("./Foo")` where `Foo.tsx` has `export default ...`.

---

## Quick reference

| Need | Use | Notes |
|------|-----|-------|
| Read a prop | `props.x` | Never destructure; reactivity is in the read |
| Default prop values | `mergeProps(defaults, props)` | Last non-`undefined` wins; lazy & reactive |
| "Destructure" / forward props | `splitProps(props, [...])` | Keeps reactivity; remainder is last return |
| Inspect/iterate children | `children(() => props.children)` | Memoized; `.toArray()` flattens |
| One-time setup / DOM access | `onMount(fn)` | Client only; refs assigned; no SSR; no tracking |
| Dispose resources | `onCleanup(fn)` | Runs on unmount / before effect re-run |
| React to a value change | `createEffect(fn)` | There is no `onUpdate` |
| DOM element reference | `let el!: T; <x ref={el} />` or `ref={(e) => ...}` | Variable assigned at creation, before DOM insert |
| Forward a ref | child assigns `props.ref` | Always delivered to child as a callback |
| Share data down tree | `createContext` + `useContext` | Wrap consumer in a throwing hook for typing |
| Reactive context | put a signal/store in `value` | No re-render; reads propagate |
| Unique id (a11y/SSR) | `createUniqueId()` | Call equally on server & client |
| Code splitting | `lazy(() => import("./X"))` + `<Suspense>` | Module needs a `default` export; has `.preload()` |
