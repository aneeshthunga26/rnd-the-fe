# SolidJS: JSX, Rendering, Events & Attribute Binding

Reference for how Solid 1.x compiles JSX to real DOM, mounts apps with `render`, handles events, and binds attributes/properties/directives. Solid's JSX is **not** a virtual DOM — `{}` expressions become fine-grained reactive updates, so the #1 mistake is breaking that tracking by reading a signal value too early.

> Applies to **Solid 1.x**. Solid compiles JSX at build time (via `babel-preset-solid` / vite-plugin-solid). Components run **once**; only the reactive expressions inside JSX re-run.

---

## JSX vs React differences

| Topic | React | Solid |
|---|---|---|
| What JSX becomes | Virtual DOM elements | **Real DOM nodes** (cloned templates + targeted updates) |
| Component re-runs | On every state change | **Once** — only `{}` expressions re-evaluate |
| CSS class | `className` | **`class`** (`className` deprecated since 1.4) |
| Label association | `htmlFor` | **`for`** |
| Class toggling | manual string | **`classList={{ ... }}`** |
| Dynamic value | `{value}` (re-renders) | `{value()}` — **must call the accessor** so Solid can track it |
| `style` | camelCase keys | **dash-case** keys (`"background-color"`) |
| Event handler args | `(e) => ...` | `(e) => ...` **or** bound `[handler, data]` |
| Refs | `useRef().current` / `forwardRef` | plain variable or callback; component refs via the `ref` prop |
| Fragments | `<>...</>` | `<>...</>` (same) |

Key consequences:

- **A component returning JSX runs only once.** Do not put plain conditionals or loops at the top level expecting re-execution — use `<Show>`, `<For>`, `<Switch>`, or accessor functions inside `{}`.
- **Reactivity lives in the expression, not the component.** `{count()}` re-runs when `count` changes; the surrounding function does not.
- A component must return **one root node** (or a fragment / array). Use `<>...</>` to group siblings.

```tsx
// React mental model (WRONG in Solid): logic at top level runs once, never updates
function Counter() {
  const [count, setCount] = createSignal(0);
  const label = count() > 5 ? "high" : "low"; // ❌ computed once, never updates
  return <p>{label}</p>;
}

// Solid: keep the dynamic part inside JSX (or a derived accessor) so it tracks
function Counter() {
  const [count, setCount] = createSignal(0);
  const label = () => (count() > 5 ? "high" : "low"); // ✅ accessor
  return <p onClick={() => setCount(c => c + 1)}>{label()}</p>;
}
```

---

## Rendering: the `render` entry point

`render(code, element)` mounts a Solid tree into a DOM container. `code` is a **function** that returns the root component/JSX (so it runs inside a reactive root). It returns a dispose function.

```tsx
import { render } from "solid-js/web";
import { App } from "./App";

const root = document.getElementById("root");

// Always wrap in an arrow function: render(() => <App />, root)
const dispose = render(() => <App />, root!);

// Tear everything down (rarely needed in app code; useful in tests/HMR)
dispose();
```

- The second argument is the **mount container**; Solid appends to it (it does not clear it by default).
- `render` is from `solid-js/web`. Other entry points: `hydrate` (client-side hydration of SSR markup), `renderToString` / `renderToStream` (server).
- Because JSX compiles to real DOM, there is no reconciliation pass — updates are applied directly to the nodes that changed.

---

## JSX is compiled to real DOM; expressions in `{}` are tracked

Static markup is hoisted into a cloned template once. Every `{}` expression becomes a fine-grained computation that updates exactly the text node / attribute it controls.

```tsx
function Hello(props: { name: string }) {
  // The <h1>/<p> structure is a static template, cloned on render.
  // Only `{props.name}` and `{count()}` re-run when their sources change.
  return (
    <div>
      <h1>Hello {props.name}</h1>
      <p>Count: {count()}</p>
    </div>
  );
}
```

**Wrap dynamic values in functions/accessors.** Anything that should update over time must be a function call inside the JSX expression — not a value snapshotted in a variable.

```tsx
const [first, setFirst] = createSignal("Ada");

// ✅ tracked: re-runs when `first` changes
<span>{first()}</span>;

// ✅ derived accessor, tracked
const greeting = () => `Hi, ${first()}`;
<span>{greeting()}</span>;

// ❌ NOT tracked: value read once at render, frozen forever
const g = `Hi, ${first()}`;
<span>{g}</span>;
```

---

## Event handling

### Delegated events (`onClick`, `onInput`, ...)

Capitalised `on*` props use Solid's **synthetic event delegation**: one listener is attached at the document for supported events, which is fast for large lists. Names are case-insensitive (`onClick` / `onclick` both listen to native `click`).

```tsx
<button onClick={() => setCount(c => c + 1)}>Increment</button>
<input onInput={e => setText(e.currentTarget.value)} />
```

- The handler receives the native event; use `e.currentTarget` for the bound element (typed correctly in Solid's JSX types).
- **Delegated handlers are not reactive** — the handler reference is read once and not rebound if it changes. Use a stable function (or read signals inside it).

### Bound handler with data: `[handler, data]`

Pass a `[fn, data]` tuple to avoid creating a closure per item. Solid calls `fn(data, event)` — **data first, event second**.

```tsx
function onRowClick(id: string, e: MouseEvent) {
  console.log(id, e.currentTarget);
}

<For each={rows()}>
  {(row) => <li onClick={[onRowClick, row.id]}>{row.label}</li>}
</For>;
```

### `on:*` — native, non-delegated listeners

`on:*` attaches a real `addEventListener` directly to the element, bypassing delegation. The name after `on:` is kept **verbatim** (case-sensitive), so it's required for custom/cased events.

```tsx
// Native wheel listener directly on the element
<div on:wheel={e => console.log(e.deltaY)} />

// Custom event with exact casing
<div on:MyEvent={e => setMessage(e.detail)} />
```

Listener options (`once`, `passive`, `capture`, `signal`) — pass an object implementing `handleEvent` (Solid ≥ 1.9):

```tsx
const handler = {
  handleEvent() { setCount(c => c + 1); },
  once: true,
  passive: true,
};

<button on:click={handler}>Click me</button>;
```

`oncapture:*` also exists (capture-phase delegated events) but is deprecated in favour of `on:` with `capture`.

---

## `classList` — toggle classes by boolean

`classList={{ ... }}` toggles individual classes via `element.classList.toggle`, updating only the keys whose boolean changed (it does **not** rewrite the whole `class` attribute). Type: `Record<string, boolean | undefined>`.

```tsx
<div
  classList={{
    active: isActive(),
    editing: currentId() === row.id,
  }}
/>;

// Keys may contain multiple space-separated classes (toggled individually)
<div classList={{ "px-2 rounded": true, selected: isSelected() }} />;

// Dynamic (computed) class name
<div classList={{ [className()]: classOn() }} />;
```

> If both `class` and `classList` are reactive on the same element, a `class` update can overwrite classes managed by `classList`. Prefer one or the other per element.

---

## `style` — string or object

Accepts a CSS **string** or an **object**. Object keys are **dash-cased** (not camelCase) and applied with `element.style.setProperty`. Nullish object values remove that property; a falsy overall `style` value removes the attribute. CSS custom properties (`--var`) are supported.

```tsx
// String form
<div style={`color: green; height: ${height()}px`} />;

// Object form — dash-case keys
<div
  style={{
    color: "green",
    "background-color": color(),
    height: `${height()}px`,
  }}
/>;

// CSS custom property (variable)
<div style={{ "--my-color": theme() }} />;
```

---

## Attributes vs properties: `attr:`, `prop:`, `bool:`

Solid decides attribute-vs-property per known element. These prefixes force the choice — essential for custom elements / web components and DOM-only properties.

### `prop:` — set a DOM **property** (not attribute)

```tsx
// Sets element.indeterminate directly (no attribute exists for it)
<input type="checkbox" prop:indeterminate={true} />;

// Pass real objects/arrays to a custom element property (preserves type)
<my-chart prop:data={chartData()} />;
```

`prop:` produces **no SSR output** (properties are client-only).

### `attr:` — force an HTML **attribute** (string-serialized)

```tsx
// Writes a string attribute; undefined/null removes it. Renders in SSR.
<my-element attr:status={status()} />;
```

### `bool:` — boolean (presence) attribute

```tsx
// truthy  -> <my-element status="">   (attribute present)
// falsy   -> <my-element>             (attribute removed)
<my-element bool:status={isOpen()} />;
```

> All three require TypeScript declarations for **custom** attributes/properties (see the directives typing section — same `declare module "solid-js"` pattern, extending the relevant JSX interface).

---

## `ref` — access the DOM element

A `ref` is assigned **during render, before the element is attached to the DOM**. Use `onMount` if you need the connected element (e.g. for measurements). Two forms:

```tsx
// 1) Variable ref — assigned to the variable
let myDiv: HTMLDivElement | undefined;
onMount(() => console.log(myDiv!.clientWidth));
<div ref={myDiv} />;

// 2) Callback ref — called with the element
<div ref={(el) => console.log(el)} />;
```

Forwarding a ref through a component: the child just binds the `ref` prop.

```tsx
function MyComp(props: { ref?: HTMLDivElement }) {
  return <div ref={props.ref} />;
}

function App() {
  let myDiv: HTMLDivElement | undefined;
  onMount(() => console.log(myDiv!.clientWidth));
  return <MyComp ref={myDiv!} />;
}
```

---

## `use:` — custom directives

`use:name={value}` calls a function `name(element, accessor)` during render (before DOM attachment). `accessor` is `() => value`; when no value is given (`use:foo`), the accessor returns `true`. **The directive function must be in scope** in the module (the compiler references it by name, so don't let bundlers tree-shake it).

```tsx
import { onCleanup, createRenderEffect, type Accessor, type Setter } from "solid-js";

// Two-way binding directive
function model(element: HTMLInputElement, value: Accessor<[Accessor<string>, Setter<string>]>) {
  const [field, setField] = value();
  createRenderEffect(() => (element.value = field()));
  const onInput = (e: Event) => setField((e.currentTarget as HTMLInputElement).value);
  element.addEventListener("input", onInput);
  onCleanup(() => element.removeEventListener("input", onInput));
}

const [name, setName] = createSignal("");
<input type="text" use:model={[name, setName]} />;
```

### Typing `use:` directives (TypeScript)

Extend the `JSX.Directives` interface inside `declare module "solid-js"`. The key is the directive name; the type is the **value** type passed to it.

```tsx
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      model: [Accessor<string>, Setter<string>];
    }
  }
}
```

> The directive name must be used somewhere in JSX, or TS/bundlers may strip the function. If you only import it, reference it (e.g. `false && model`) — or just use it in a `use:` binding.

---

## Spreads and dynamic attributes

Spread props onto an element; Solid keeps reactivity for spread keys backed by accessors.

```tsx
const props = { type: "text", placeholder: "Name", disabled: isDisabled() };
<input {...props} />;

// Spreads merge with explicit attributes (later wins on conflict)
<input {...props} class="field" />;
```

For **dynamic component/element types**, use `<Dynamic>` (from `solid-js/web`):

```tsx
import { Dynamic } from "solid-js/web";

<Dynamic component={isLink() ? "a" : "button"} href={href()} onClick={onClick}>
  {label()}
</Dynamic>;
```

**Reactivity + spreads gotcha:** spreading/destructuring a `props` object outside JSX or Solid primitives can break tracking, because props are lazy getters. Use `mergeProps` (defaults/merge) and `splitProps` (destructure) to preserve reactivity:

```tsx
import { mergeProps, splitProps } from "solid-js";

function Button(props: { variant?: string; class?: string; onClick?: () => void }) {
  const merged = mergeProps({ variant: "primary" }, props);   // defaults, reactive
  const [local, rest] = splitProps(merged, ["variant"]);      // split, reactive
  return <button class={`btn btn-${local.variant}`} {...rest} />;
}
```

---

## `innerHTML` / `textContent`

```tsx
// Replaces children with parsed markup. ⚠️ XSS risk with untrusted input.
<div innerHTML={"<strong>Hello</strong>"} />;

// Plain text, not parsed — safe for untrusted strings
<div textContent={userInput()} />;
```

- `innerHTML` writes through the DOM `innerHTML` property and emits **unescaped** HTML in SSR. Never pass unsanitised user data.
- Use `textContent` (or just `{value}` as a child) for plain text.

---

## Common gotchas (tracking)

```tsx
const [count, setCount] = createSignal(0);

// ❌ Passing the signal value instead of calling the accessor in a stored var
const c = count();          // read ONCE; frozen
<p>{c}</p>;                 // never updates

// ✅ Call the accessor inside JSX
<p>{count()}</p>;

// ❌ Logic that snapshots the value outside a tracked scope
const isHigh = count() > 5; // computed once
<Show when={isHigh}>High</Show>;

// ✅ Pass an accessor so the condition re-runs
<Show when={count() > 5}>High</Show>;          // expression is tracked
// or
const isHigh = () => count() > 5;
<Show when={isHigh()}>High</Show>;

// ❌ Destructuring props breaks reactivity
function Bad({ name }: { name: string }) {
  return <span>{name}</span>;                   // name captured once
}

// ✅ Read props.x inside JSX (or use splitProps)
function Good(props: { name: string }) {
  return <span>{props.name}</span>;             // tracked getter
}

// ❌ Calling the accessor when passing to a prop that should stay reactive
<Child value={count()} />;   // fine ONLY if Child re-reads via its props getter;
                             // but if you store it, it's frozen — pass count or () => count()
// ✅ Pass the accessor itself when the child expects a function
<Child value={count} />;     // child calls props.value()
```

Rule of thumb: **the call to `signal()` should happen inside the JSX expression or a tracked scope (effect/memo/`<Show when>`/derived accessor)** — never snapshotted into a plain variable you later render.
