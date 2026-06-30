# SolidJS Stores (Solid 1.x)

Stores are proxy-wrapped, deeply nested reactive state with fine-grained per-property tracking, updated through a path-based setter (or `produce`/`reconcile`). Use them when signals get awkward for nested objects/arrays.

> Scope: Solid **1.x**. Import store APIs from `solid-js/store` (not `solid-js`). Reactivity only tracks reads made inside a tracking scope (effects, memos, JSX, component bodies).

---

## When to use a store vs signal

| Use a **signal** (`createSignal`) | Use a **store** (`createStore`) |
| --- | --- |
| Single primitive or atomic value (`count`, `isOpen`, a string). | Nested object/array where you want updates to one field to *not* re-run readers of other fields. |
| You replace the whole value on every update. | You mutate parts of a larger structure (lists of rows, form models, fetched entities). |
| Value is opaque (DOM node, class instance you won't track field-by-field). | You read deep paths in many places and want surgical updates. |

Rules of thumb:

- A store does **not** track the container itself the way a signal does. Reading `store.user.name` subscribes you to `name` only; adding/removing `user` keys is tracked separately. Reading the whole `store` object does *not* deeply subscribe.
- Prefer `createStore` (read-only proxy + explicit setter) over `createMutable`. See [createMutable](#createmutable--modifymutable).
- A store value can itself be undefined/array/object; the top level is usually an object.

```tsx
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

const [count, setCount] = createSignal(0);            // atomic
const [state, setState] = createStore({ todos: [] }); // nested
```

---

## createStore

```ts
function createStore<T extends object>(
  store: T,
  options?: { name?: string }
): [get: Store<T>, set: SetStoreFunction<T>];
```

Returns a tuple: a read-only proxy and a setter. The proxy only creates reactive nodes lazily as you read properties, so deep trees stay cheap. **Direct mutation of the proxy is blocked** — you must go through the setter.

```tsx
import { createStore } from "solid-js/store";

const [state, setState] = createStore({
  user: { firstName: "John", lastName: "Smith" },
  todos: [{ id: 1, text: "learn solid", done: false }],
});

// read (subscribes only to user.firstName where read in a tracking scope)
state.user.firstName; // "John"

// state.user.firstName = "Will"; // ❌ throws / no-op: store is read-only
```

### Fine-grained nested reactivity

Each property gets its own reactive node. An effect that reads `state.user.firstName` re-runs only when `firstName` changes — not when `lastName` or `todos` change.

```tsx
import { createEffect } from "solid-js";

createEffect(() => console.log(state.user.firstName)); // runs again only on firstName change
setState("user", "lastName", "Doe"); // ⟶ effect above does NOT re-run
setState("user", "firstName", "Will"); // ⟶ effect re-runs
```

### Path-based setter syntax

The last argument is the value; preceding arguments form the path to it.

```tsx
setState("user", "firstName", "Will");
// equivalent to: state.user.firstName = "Will"

setState("todos", 0, "done", true);
// equivalent to: state.todos[0].done = true
```

### Object shallow-merge

Passing an object at a path **shallow-merges** it into the existing object (top-level keys only).

```tsx
const [state, setState] = createStore({ user: { name: "John", age: 30 } });
setState("user", { age: 31 });        // merges ⟶ { name: "John", age: 31 }
setState("user", { addr: { city: "X" } }); // adds addr; sibling keys preserved
```

Note: a **single array value** at a path *replaces* the array rather than merging.

### Function updaters

A function at the value position receives the **current value at that path** and returns the new value. This is the safe way to derive from previous state.

```tsx
setState("todos", 0, "done", (prev) => !prev);
setState("count", (c) => c + 1);
```

### Array updates: append, index, range, filter

```tsx
const [state, setState] = createStore({
  todos: [
    { id: 1, text: "a", done: false },
    { id: 2, text: "b", done: false },
    { id: 3, text: "c", done: false },
  ],
});

// append (index === length)
setState("todos", state.todos.length, { id: 4, text: "d", done: false });

// update by index
setState("todos", 1, "done", true);

// array of indices — update several explicit positions
setState("todos", [0, 2], "done", true);

// range: { from, to, by? } (inclusive of `to`)
setState("todos", { from: 0, to: 1 }, "done", true);
setState("todos", { from: 0, to: 2, by: 2 }, "done", true); // 0 and 2

// filter predicate (item, index) => boolean — update matching items
setState(
  "todos",
  (todo, i) => todo.text.startsWith("a"),
  "done",
  true
);

// replace the whole array (immutably) — use map/filter then assign
setState("todos", (todos) => todos.filter((t) => !t.done));
setState("todos", (todos) => todos.map((t) => ({ ...t, done: true })));
```

> Tip: building a brand-new array each time loses fine-grained benefits for unchanged rows. Use [`reconcile`](#reconcile) when replacing array contents from a server, or path updates for in-place edits.

---

## produce

```ts
function produce<T>(fn: (state: T) => void): (state: T) => T;
```

Immer-like. Gives you a **mutable draft** proxy; you mutate it imperatively and Solid records the changes and applies them through the normal setter (preserving fine-grained updates). Ideal for several edits at once or deep mutation without long paths. Works on the value at the path you pass it to (object **or** array).

```tsx
import { produce } from "solid-js/store";

setState(
  "user",
  produce((user) => {
    user.firstName = "Will";
    user.lastName = "Doe";
  })
);

// arrays: push / splice / index assignment all work on the draft
setState(
  "todos",
  produce((todos) => {
    todos.push({ id: 9, text: "new", done: false });
    todos[0].done = true;
  })
);
```

`produce` is for **local mutation of existing store data**. It does not deep-clone, and you should not hold onto the draft after the callback returns.

---

## reconcile

```ts
function reconcile<T>(
  value: T,
  options?: { key?: string | null; merge?: boolean }
): (state: T) => T;
// options.key default: "id"; options.merge default: undefined (false)
```

Diffs new (typically external/server) data **into** an existing store, mutating only what actually changed so unchanged nodes keep their identity and dependent computations don't re-run. Use it instead of wholesale assignment when refetching.

```tsx
import { reconcile } from "solid-js/store";

const [state, setState] = createStore({ list: [] as Item[] });

async function refresh() {
  const fresh = await fetchItems();
  // matches array items by `id`, diffs fields in place
  setState("list", reconcile(fresh));
}
```

Options:

- **`key`** (default `"id"`): the field used to match items in arrays so they're updated rather than recreated. Set `key: null` to disable keyed matching (position-based diff).
- **`merge`** (default `false`): when `false`, reconcile diffs structurally (preferred — preserves references). When `true`, it shallow-merges keys instead of replacing, useful for objects whose previous extra keys should be kept.

Common with `createResource`:

```tsx
import { createResource } from "solid-js";

const [data] = createResource(fetchData);
createEffect(() => {
  if (data()) setState("entity", reconcile(data()!));
});
```

---

## unwrap

```ts
function unwrap<T>(store: T): T;
```

Returns the underlying **raw**, non-reactive object (no proxy). Reading it does not subscribe. Use for serialization, passing to third-party libraries, snapshots, or debugging.

```tsx
import { unwrap } from "solid-js/store";

const raw = unwrap(state);     // plain object, no tracking
JSON.stringify(unwrap(state)); // safe snapshot
console.log(unwrap(state.todos));
```

> `unwrap` returns the live underlying object — mutating it directly bypasses reactivity (don't). Clone it (`structuredClone(unwrap(...))`) if you need an independent copy.

---

## Store getters / derived values

Define a JS getter on the store object; reads of the getter participate in reactivity based on what the getter reads. Good for values derived from other store fields without a separate memo.

```tsx
const [state, setState] = createStore({
  firstName: "John",
  lastName: "Smith",
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
});

state.fullName; // "John Smith" — recomputes when firstName/lastName change
```

Getters recompute on every read (not memoized). For an expensive derivation, wrap a `createMemo` instead:

```tsx
import { createMemo } from "solid-js";

const sortedTodos = createMemo(() =>
  [...state.todos].sort((a, b) => a.text.localeCompare(b.text))
);
sortedTodos(); // tracked, cached
```

---

## createMutable / modifyMutable

```ts
function createMutable<T extends object>(state: T, options?: { name?: string }): T;
function modifyMutable<T>(state: T, modifier: (state: T) => T): void;
```

`createMutable` returns a single proxy you mutate **by direct assignment** (no setter). It binds getters/setters to the proxy so `this` is reactive — handy for class instances or porting MobX/Vue code.

```tsx
import { createMutable, modifyMutable } from "solid-js/store";
import { produce, reconcile } from "solid-js/store";

const state = createMutable({ count: 0, user: { name: "John" } });
state.count++;                 // reactive
state.user.name = "Will";      // reactive

// batch many mutations / apply produce or reconcile to a mutable
modifyMutable(state, produce((s) => { s.count = 10; s.user.name = "Doe"; }));
modifyMutable(state, reconcile(serverState));
```

**When to avoid:** prefer `createStore` for almost everything. Mutable state hides *where* updates happen (any assignment anywhere can trigger reactivity), making code harder to reason about and refactor, and it's easy to accidentally mutate from places you didn't intend (e.g. passing the object down and having a child write to it). Reach for `createMutable` only for local, contained state or interop with mutation-style libraries.

---

## Patterns

### Passing stores to components

Pass the store proxy (and setter if needed) directly. Do **not** destructure store properties at the top of a component — destructuring reads the value immediately and breaks tracking. Access via the proxy in JSX/effects, or via a getter prop.

```tsx
function TodoItem(props: { todo: Todo; toggle: (id: number) => void }) {
  // ✅ props.todo.done stays reactive
  return (
    <li onClick={() => props.toggle(props.todo.id)}>
      {props.todo.text} {props.todo.done ? "✓" : ""}
    </li>
  );
}

function List() {
  const [state, setState] = createStore({ todos: [] as Todo[] });
  const toggle = (id: number) =>
    setState("todos", (t) => t.id === id, "done", (d) => !d);
  return (
    <For each={state.todos}>
      {(todo) => <TodoItem todo={todo} toggle={toggle} />}
    </For>
  );
}
```

```tsx
// ❌ breaks reactivity — reads the value once, no subscription
function Bad(props: { todo: Todo }) {
  const { done } = props.todo; // snapshot, never updates
  return <span>{done}</span>;
}
```

### Store in context (shared/global state)

Create the store inside a provider and expose `[store, actions]` via context. Keep the setter private and expose action functions for clearer call sites.

```tsx
import { createContext, useContext, ParentComponent } from "solid-js";
import { createStore } from "solid-js/store";

type Todo = { id: number; text: string; done: boolean };

function makeTodos() {
  const [state, setState] = createStore({ todos: [] as Todo[] });
  const actions = {
    add: (text: string) =>
      setState("todos", (t) => [...t, { id: Date.now(), text, done: false }]),
    toggle: (id: number) =>
      setState("todos", (t) => t.id === id, "done", (d) => !d),
  };
  return [state, actions] as const;
}

type TodosCtx = ReturnType<typeof makeTodos>;
const TodosContext = createContext<TodosCtx>();

export const TodosProvider: ParentComponent = (props) => (
  <TodosContext.Provider value={makeTodos()}>
    {props.children}
  </TodosContext.Provider>
);

export function useTodos() {
  const ctx = useContext(TodosContext);
  if (!ctx) throw new Error("useTodos must be used within TodosProvider");
  return ctx;
}

// usage
function AddButton() {
  const [, { add }] = useTodos();
  return <button onClick={() => add("new")}>add</button>;
}
```

---

## Quick reference

| API | Purpose |
| --- | --- |
| `createStore(obj)` | Read-only proxy + path setter; fine-grained nested reactivity. |
| `setState(...path, value)` | Update at a path; value may be a function `(prev) => next`. |
| `setState(path, partialObj)` | Shallow-merge an object at a path. |
| `setState("arr", idxOrRangeOrPredicate, ...)` | Targeted array updates. |
| `produce(fn)` | Mutable draft for local imperative edits. |
| `reconcile(value, { key, merge })` | Diff external data in, preserving references. |
| `unwrap(store)` | Raw non-reactive snapshot. |
| store getters / `createMemo` | Derived values. |
| `createMutable(obj)` / `modifyMutable` | Assignment-based mutable proxy (use sparingly). |
