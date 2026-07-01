import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { SHORTCUTS, type ShortcutId } from "../../shortcuts/config";
import { format, fromEvent, isModifierKey, parse, stringify } from "../../shortcuts/keybinding";
import { useShortcuts } from "../../shortcuts/useShortcuts";

/**
 * "Keyboard shortcuts" settings section: lists each rebindable shortcut with
 * its current combo, a record-to-rebind control, a reset-to-default button, and
 * a conflict warning when two shortcuts share a combo. Standalone — a later
 * phase wires it into the Settings screen.
 */
export const ShortcutsSettings: Component = () => {
  const shortcuts = useShortcuts();
  const [recording, setRecording] = createSignal<ShortcutId | null>(null);

  // combo-string -> list of shortcut ids using it (for conflict detection).
  const conflicts = createMemo(() => {
    const byCombo = new Map<string, ShortcutId[]>();
    for (const s of SHORTCUTS) {
      const combo = stringify(shortcuts.binding(s.id));
      byCombo.set(combo, [...(byCombo.get(combo) ?? []), s.id]);
    }
    const clashing = new Set<ShortcutId>();
    for (const ids of byCombo.values()) {
      if (ids.length > 1) for (const id of ids) clashing.add(id);
    }
    return clashing;
  });

  const startRecording = (id: ShortcutId) => setRecording(id);

  const onRecordKeyDown = (id: ShortcutId, e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      setRecording(null);
      return;
    }
    // Ignore lone modifier presses — wait for a real key.
    if (isModifierKey(e.key)) return;
    shortcuts.setBinding(id, fromEvent(e));
    setRecording(null);
  };

  return (
    <section class="space-y-3">
      <h2 class="text-base font-semibold text-fg">Keyboard shortcuts</h2>
      <ul class="divide-y divide-line rounded-lg border border-line">
        <For each={SHORTCUTS}>
          {(shortcut) => {
            const isRecording = () => recording() === shortcut.id;
            const inConflict = () => conflicts().has(shortcut.id);
            return (
              <li class="flex items-center justify-between gap-4 px-4 py-3">
                <div class="min-w-0">
                  <div class="text-sm text-fg">{shortcut.label}</div>
                  <Show when={inConflict()}>
                    <div class="text-xs text-danger">Conflicts with another shortcut</div>
                  </Show>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startRecording(shortcut.id)}
                    onKeyDown={(e) => isRecording() && onRecordKeyDown(shortcut.id, e)}
                    onBlur={() => isRecording() && setRecording(null)}
                    class="min-w-24 rounded-md border px-3 py-1.5 text-sm"
                    classList={{
                      "border-brand text-brand bg-brand-light": isRecording(),
                      "border-line text-fg bg-surface hover:bg-row-hover": !isRecording(),
                    }}
                    aria-label={`Rebind ${shortcut.label}`}
                  >
                    <Show
                      when={isRecording()}
                      fallback={format(parse(shortcuts.bindings()[shortcut.id]))}
                    >
                      Press keys...
                    </Show>
                  </button>
                  <button
                    type="button"
                    onClick={() => shortcuts.resetBinding(shortcut.id)}
                    class="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:bg-row-hover"
                  >
                    Reset
                  </button>
                </div>
              </li>
            );
          }}
        </For>
      </ul>
    </section>
  );
};

export default ShortcutsSettings;
