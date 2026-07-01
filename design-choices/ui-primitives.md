# Design choice — UI primitives (Kobalte)

**Decision:** use **Kobalte** (`@kobalte/core`) for accessible headless primitives that need focus management /
ARIA — Dialog (Modal), DropdownMenu/Popover (Menu), Combobox — wrapped in our own thin, Tailwind-styled
components (`components/ui/Modal`, `Menu`, `ConfirmModal`, `components/inputs/AsyncCombobox`). Everything else
(buttons, inputs, table cells) is plain styled elements.

**Why:**
- **Accessibility is hard to get right** — focus trap, ARIA roles, keyboard interaction, dismiss behaviour.
  Kobalte is the mature Solid equivalent of Radix; reusing it beats hand-rolling a11y.
- **Headless + tree-shakeable** — no styling shipped; we style with tokens/Tailwind. Import only what's used,
  so the bundle only pays for the primitives we actually mount (Dialog, Menu, Combobox).
- **Reserve it for what needs it** — only components requiring focus/ARIA use Kobalte; simple controls stay
  plain elements, keeping the dependency surface small.

## Costs / trade-offs
- **A dependency** — added in the stocktakes `00-foundation` unit. Weighed against the cost/risk of
  hand-rolling accessible dialogs/menus/comboboxes (high). Worth it.
- **Solid-version coupling** — Kobalte targets Solid **1.x**; it was one of the libraries that pushed the
  rollback from Solid 2.0 (see `framework.md`). Re-check its 2.0 support before any future upgrade.
- **Styling glue** — each primitive needs a small styled wrapper to match the app; one-time per primitive.
- **Combobox virtualization** — Kobalte renders all options; large lists need a `first` cap + server filter
  (or its virtualized listbox). See `tables.md` / `../specs/refactor/SPEC.md` Part D.

## Alternatives rejected
- **corvu** — newer, smaller Solid headless set; viable fallback but Kobalte is more complete.
- **Hand-rolled a11y** — too error-prone for dialogs/menus/comboboxes.
- **A styled component kit (MUI-like)** — heavy runtime + opinionated styling; conflicts with our Tailwind/
  token approach.

## Net
Kobalte gives correct accessibility for the few primitives that need it, headless so it costs only styling +
the tree-shaken code for what we use. Keep usage minimal and re-verify on any Solid 2.0 move.
