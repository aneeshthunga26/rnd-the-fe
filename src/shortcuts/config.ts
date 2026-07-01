// Default shortcut definitions + storage key. Rebindable shortcuts are listed
// here; add rows to extend (e.g. "Go to Stocktakes"). Bindings persist to
// localStorage[SHORTCUT_STORAGE_KEY] as { [id]: "ctrl+k" }; unset ids fall back
// to `default`.

export const SHORTCUT_STORAGE_KEY = "rnd-the-fe/shortcuts";

export const SHORTCUTS = [
  { id: "command-palette", label: "Open command palette", default: "mod+k" }, // Ctrl+K / ⌘K
] as const;

export type ShortcutId = (typeof SHORTCUTS)[number]["id"];

/** Persisted overrides shape: shortcut id → binding string. */
export type BindingMap = Partial<Record<ShortcutId, string>>;
