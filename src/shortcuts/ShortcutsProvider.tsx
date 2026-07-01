import {
  type Accessor,
  createContext,
  createSignal,
  lazy,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  Suspense,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { type BindingMap, SHORTCUT_STORAGE_KEY, SHORTCUTS, type ShortcutId } from "./config";

// Deferred: the palette UI (and its command-list building) loads on first open,
// not at startup. The global keydown listener + keybinding model stay eager.
const CommandPalette = lazy(() => import("./CommandPalette").then((m) => ({ default: m.CommandPalette })));
import { type KeyBinding, matches, parse, stringify } from "./keybinding";

export interface ShortcutsContextValue {
  /** Effective binding string per shortcut id (override or default). */
  bindings: Accessor<Record<ShortcutId, string>>;
  /** Resolve a shortcut id to its parsed binding. */
  binding: (id: ShortcutId) => KeyBinding;
  /** Set (and persist) a custom binding for a shortcut. */
  setBinding: (id: ShortcutId, binding: KeyBinding | string) => void;
  /** Clear the override so the id falls back to its default. */
  resetBinding: (id: ShortcutId) => void;
  isPaletteOpen: Accessor<boolean>;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const Context = createContext<ShortcutsContextValue>();

const DEFAULTS: Record<ShortcutId, string> = Object.fromEntries(
  SHORTCUTS.map((s) => [s.id, s.default]),
) as Record<ShortcutId, string>;

const loadOverrides = (): BindingMap => {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as BindingMap;
  } catch {
    // ignore malformed storage
  }
  return {};
};

/**
 * Holds the persisted binding overrides + the palette open flag, and registers
 * a single global keydown listener that opens the command palette on its
 * binding (fires even when focus is in an input — palettes are global). Renders
 * <CommandPalette/> so it is available on every route. Must be mounted INSIDE
 * the Router so the palette's useNavigate works.
 */
export const ShortcutsProvider: ParentComponent = (props) => {
  const [overrides, setOverrides] = createStore<BindingMap>(loadOverrides());
  const [isPaletteOpen, setPaletteOpen] = createSignal(false);

  const bindings = (): Record<ShortcutId, string> => {
    const result = { ...DEFAULTS };
    for (const s of SHORTCUTS) {
      const override = overrides[s.id];
      if (override) result[s.id] = override;
    }
    return result;
  };

  const binding = (id: ShortcutId): KeyBinding => parse(overrides[id] ?? DEFAULTS[id]);

  const persist = () => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify({ ...overrides }));
    } catch {
      // ignore quota / privacy-mode failures
    }
  };

  const setBinding: ShortcutsContextValue["setBinding"] = (id, next) => {
    setOverrides(id, typeof next === "string" ? next : stringify(next));
    persist();
  };

  const resetBinding: ShortcutsContextValue["resetBinding"] = (id) => {
    setOverrides(id, undefined);
    persist();
  };

  const openPalette = () => setPaletteOpen(true);
  const closePalette = () => setPaletteOpen(false);
  const togglePalette = () => setPaletteOpen((v) => !v);

  const onKeyDown = (e: KeyboardEvent) => {
    if (matches(binding("command-palette"), e)) {
      e.preventDefault();
      togglePalette();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  const value: ShortcutsContextValue = {
    bindings,
    binding,
    setBinding,
    resetBinding,
    isPaletteOpen,
    openPalette,
    closePalette,
    togglePalette,
  };

  return (
    <Context.Provider value={value}>
      {props.children}
      <Show when={isPaletteOpen()}>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </Show>
    </Context.Provider>
  );
};

/** Access the shortcuts context; throws if used outside the provider. */
export const useShortcutsContext = (): ShortcutsContextValue => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
};
