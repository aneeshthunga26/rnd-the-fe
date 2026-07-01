import { useShortcutsContext } from "./ShortcutsProvider";

/**
 * Public hook for the shortcut system: binding read/write + palette controls.
 * Thin re-export of the context so screens/settings don't import the provider.
 */
export const useShortcuts = () => useShortcutsContext();
