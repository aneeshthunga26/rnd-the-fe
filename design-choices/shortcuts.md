# Design choice — Keyboard shortcuts & command palette

**Decision:** a small in-house **shortcut system**: a global keydown listener with **rebindable** bindings
(persisted to localStorage, editable under Settings), and a **command palette** (Ctrl/⌘+K) that lists every
registered screen — search to filter, ↑/↓ to move, Enter to navigate. Built as data (a command list) so
non-navigation commands can be added later. (Spec: `../specs/shortcuts/SPEC.md`.)

**Why:**
- **No library needed** — it's a `keydown` matcher + a signal + a filtered list. Pure Solid + DOM +
  `useNavigate`; ~no bundle cost, no dependency.
- **Commands derive from existing route data** (`ROUTES` + `routeMeta`), so the palette stays in sync with
  registered screens for free (excludes dynamic `:id` routes).
- **Rebindable + extensible from day one** — a `SHORTCUTS` list + a keybinding model (`parse`/`matches`/
  `format`, `mod` = Ctrl/⌘), so adding shortcuts or commands is additive.
- Fast navigation is a velocity win for power users and demos.

## Costs / trade-offs
- **We own key handling** — a global listener, modifier normalisation (`mod`), and not clobbering browser
  shortcuts (Ctrl/⌘+K is a deliberate global; `preventDefault`). Edge cases (focus in inputs, OS differences)
  are ours to handle.
- **Router-scoped mounting** — the palette uses `useNavigate`, so `ShortcutsProvider` must mount **inside** the
  Router (`<Router root>`), not the outer provider stack — a wiring subtlety (captured in
  `../specs/conventions.md`).
- **Settings coupling** — the rebind editor renders inside the theming Settings screen, so it lands after
  theming-infra (the palette itself is independent).
- **Not virtualized** — the palette list is short (registered screens) so plain render is fine; revisit only if
  commands grow into the hundreds (per the "when to virtualize" rule).
- **Rebinding needs conflict detection** and persistence/versioning as more shortcuts are added.

## Alternatives rejected
- **A hotkey/command-palette library** — unnecessary weight for a keydown matcher + list; against small-bundle.

## Net
A tiny, dependency-free system that turns the existing route registry into a fast navigation palette and a
rebindable shortcut layer. Cost is owning key handling + the router-scoped mount. Extensible to arbitrary
commands later.
