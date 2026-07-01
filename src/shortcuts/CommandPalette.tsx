import { type Component, createEffect, createMemo, createSignal, For, on, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useShortcutsContext } from "./ShortcutsProvider";
import { type Command, useCommands } from "./useCommands";

/** Inline search glyph (icons.tsx is a shared file we don't own here). */
const SearchGlyph: Component<{ class?: string }> = (props) => (
  <svg
    class={props.class ?? "h-5 w-5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

/**
 * Command palette modal: a centered panel over a dim overlay. Autofocused
 * search input filters registered screens; ArrowUp/Down move a wrapping
 * highlight, Enter runs + closes, Esc closes. Rendered only when open.
 */
export const CommandPalette: Component = () => {
  const shortcuts = useShortcutsContext();
  const commands = useCommands();

  const [query, setQuery] = createSignal("");
  const [highlight, setHighlight] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  const filtered = createMemo<Command[]>(() => {
    const q = query().trim().toLowerCase();
    const all = commands();
    if (!q) return all;
    return all.filter((c) => `${c.title} ${c.keywords ?? ""} ${c.path}`.toLowerCase().includes(q));
  });

  // Reset query + highlight when the palette opens; focus the input.
  createEffect(
    on(shortcuts.isPaletteOpen, (open) => {
      if (open) {
        setQuery("");
        setHighlight(0);
        queueMicrotask(() => inputRef?.focus());
      }
    }),
  );

  // Keep the highlight in range as the filtered list changes.
  createEffect(() => {
    const count = filtered().length;
    if (highlight() >= count) setHighlight(count > 0 ? count - 1 : 0);
  });

  const runCommand = (command: Command) => {
    shortcuts.closePalette();
    command.run();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const list = filtered();
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (list.length > 0) setHighlight((i) => (i + 1) % list.length);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (list.length > 0) setHighlight((i) => (i - 1 + list.length) % list.length);
        break;
      }
      case "Enter": {
        e.preventDefault();
        const command = list[highlight()];
        if (command) runCommand(command);
        break;
      }
      case "Escape": {
        e.preventDefault();
        shortcuts.closePalette();
        break;
      }
    }
  };

  return (
    <Show when={shortcuts.isPaletteOpen()}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-start justify-center bg-overlay p-4 pt-[15vh]"
          onClick={() => shortcuts.closePalette()}
        >
          <div
            class="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-bg text-fg shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center gap-3 border-b border-line px-4 py-3">
              <SearchGlyph class="h-5 w-5 text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query()}
                onInput={(e) => {
                  setQuery(e.currentTarget.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search screens..."
                aria-label="Search commands"
                aria-controls="command-palette-list"
                class="w-full bg-transparent text-base outline-none placeholder:text-muted"
                autocomplete="off"
                spellcheck={false}
              />
            </div>

            <ul id="command-palette-list" role="listbox" class="flex-1 overflow-auto py-1">
              <Show
                when={filtered().length > 0}
                fallback={<li class="px-4 py-6 text-center text-sm text-muted">No results</li>}
              >
                <For each={filtered()}>
                  {(command, index) => (
                    <li
                      role="option"
                      aria-selected={highlight() === index()}
                      onMouseEnter={() => setHighlight(index())}
                      onClick={() => runCommand(command)}
                      class="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      classList={{
                        "bg-brand-light text-brand": highlight() === index(),
                      }}
                    >
                      <span class="truncate">{command.title}</span>
                      <span class="truncate text-xs text-muted">{command.path}</span>
                    </li>
                  )}
                </For>
              </Show>
            </ul>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
