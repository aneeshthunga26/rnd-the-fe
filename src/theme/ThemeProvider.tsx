import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  type ParentComponent,
  useContext,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import {
  BUILTIN_THEMES,
  CUSTOM_THEMES_STORAGE_KEY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "./config";
import { TOKENS, type ThemeVars } from "./tokens";

/** A user-defined theme: a name + a map of semantic tokens to values. */
export interface CustomTheme {
  id: string;
  name: string;
  vars: ThemeVars;
}

export interface ThemeContextValue {
  /** Active theme id — a builtin ("light" | "dark" | "system") or a custom theme id. */
  themeId: Accessor<string>;
  /** Persist + apply a theme by id. */
  setTheme: (id: string) => void;
  /** All selectable themes: builtin ids followed by the custom themes. */
  themes: Accessor<Array<string | CustomTheme>>;
  /** The user-defined themes (reactive). */
  customThemes: Accessor<CustomTheme[]>;
  /** Create or update a custom theme (matched by id). */
  saveCustomTheme: (theme: CustomTheme) => void;
  /** Remove a custom theme; if it was active, fall back to the default. */
  deleteCustomTheme: (id: string) => void;
  /** Re-apply the currently active theme (used by the editor to cancel a live preview). */
  reapply: () => void;
}

const Context = createContext<ThemeContextValue>();

const readThemeId = (): string => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const readCustomThemes = (): CustomTheme[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomTheme[]) : [];
  } catch {
    return [];
  }
};

/**
 * Owns the theming runtime: a persisted `themeId` signal, a persisted store of
 * custom themes, and a single `createEffect` that applies the active theme to
 * `<html>` (either via `data-theme` for builtins or inline `setProperty` vars
 * for custom themes). Also listens to `prefers-color-scheme` so `"system"`
 * re-applies when the OS setting changes. Mounting is owned by the conventions
 * sweep (`src/app/Providers.tsx`) — do not wire this into `index.tsx` here.
 */
export const ThemeProvider: ParentComponent = (props) => {
  const [themeId, setThemeIdSignal] = createSignal<string>(readThemeId());
  const [customThemes, setCustomThemes] = createStore<CustomTheme[]>(readCustomThemes());
  // Bumped by the matchMedia listener so the apply-effect re-runs for "system".
  const [osTick, setOsTick] = createSignal(0);

  const persistCustomThemes = () => {
    try {
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
    } catch {
      /* ignore quota / unavailable storage */
    }
  };

  const setTheme = (id: string) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setThemeIdSignal(id);
  };

  const saveCustomTheme = (theme: CustomTheme) => {
    const index = customThemes.findIndex((c) => c.id === theme.id);
    if (index >= 0) setCustomThemes(index, theme);
    else setCustomThemes(produce((list) => list.push(theme)));
    persistCustomThemes();
  };

  const deleteCustomTheme = (id: string) => {
    setCustomThemes((list) => list.filter((c) => c.id !== id));
    persistCustomThemes();
    if (themeId() === id) setTheme(DEFAULT_THEME);
  };

  // Apply the active theme. Runs whenever themeId, the custom themes, or the OS
  // preference change. Clears any previously-applied inline vars first so a
  // switch back to a builtin doesn't leave stale custom values in place.
  const applyTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    for (const t of TOKENS) root.style.removeProperty(t.var);

    const id = themeId();
    const custom = customThemes.find((c) => c.id === id);
    if (custom) {
      root.dataset.theme = "custom";
      for (const [k, v] of Object.entries(custom.vars)) {
        if (v) root.style.setProperty(k, v);
      }
    } else {
      root.dataset.theme = id; // "light" | "dark" | "system"
    }
  };

  createEffect(() => {
    // Track dependencies explicitly so the effect re-runs on any of them.
    themeId();
    void customThemes.length;
    customThemes.map((c) => c.vars); // track custom var edits (e.g. after save)
    osTick();
    applyTheme();
  });

  // System theme: CSS handles the actual values via the media query, but we bump
  // a tick so the effect re-runs (useful if custom vars ever depend on it).
  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (themeId() === "system") setOsTick((n) => n + 1);
    };
    mql.addEventListener("change", onChange);
    onCleanup(() => mql.removeEventListener("change", onChange));
  }

  const value: ThemeContextValue = {
    themeId,
    setTheme,
    themes: () => [...BUILTIN_THEMES, ...customThemes],
    customThemes: () => customThemes,
    saveCustomTheme,
    deleteCustomTheme,
    reapply: applyTheme,
  };

  return <Context.Provider value={value}>{props.children}</Context.Provider>;
};

/** Internal accessor used by the `useTheme` hook. */
export const useThemeContext = (): ThemeContextValue => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
