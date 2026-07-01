# 04 — Fullscreen mode — Wave 2 (needs 00)

The **second** of the three toolbar buttons toggles fullscreen: when on, the entire viewport shows **only**
the table toolbar buttons, the table, and its pagination — no sidebar/app bar/filter bar/footer chrome.

Reference: open-mSupply uses Material-React-Table's `enableFullScreenToggle`. We implement it ourselves.

## Build

1. `src/components/table/useFullscreen.tsx` — a signal-based hook `{ isFullscreen, toggle, setFullscreen }`.
   Optionally sync with the native Fullscreen API on a container ref, but a CSS-overlay approach is simpler
   and sufficient: when on, a fixed `inset-0 z-50 bg-page` overlay contains the table region.

2. `src/components/table/FullscreenContainer.tsx` — a wrapper: `props.isFullscreen ? <div class="fixed inset-0 z-50 flex flex-col bg-page p-4">{children}</div> : <>{children}</>`.
   Children = the table region only (toolbar buttons + `DataTable` + `TablePagination`). Include an exit
   affordance (the 2nd toolbar button also toggles off; optionally Esc key closes).

3. Wire in `ListView.tsx` at `{/* SLOT:toolbar-fullscreen */}`:
   - `const fs = useFullscreen();`
   - Wrap the table region (toolbar-buttons row + DataTable + TablePagination) in
     `<FullscreenContainer isFullscreen={fs.isFullscreen()}>…</FullscreenContainer>`.
   - The 2nd `TableToolbar` button's `onFullscreen` → `fs.toggle()` (swap the icon to a "collapse" glyph
     when active).
   - When fullscreen, the AppBar/FilterBar/Sidebar are outside the overlay so they're visually replaced by
     it (overlay covers them). Ensure the filter bar is NOT inside the wrapped region (so it disappears in
     fullscreen, per the requirement) — only toolbar buttons + table + pagination are inside.

## Acceptance

Clicking the 2nd toolbar button expands the table to fill the screen showing only toolbar buttons + table +
pagination; clicking again (or Esc) restores. `pnpm typecheck`/`build` pass.

## Parallel-safety

Owns `useFullscreen.tsx` + `FullscreenContainer.tsx`; edits only the `SLOT:toolbar-fullscreen` region of
`ListView.tsx` (wrapping the table region). Coordinate the wrap boundary with 03/05 which attach to sibling
toolbar buttons.
