/**
 * Theming configuration constants. The storage keys here MUST stay in sync with
 * the inline no-FOUC script in `index.html` (which can't import this module).
 */

/** Built-in theme ids. `light`/`dark` are static `[data-theme]` CSS blocks; `system` follows the OS. */
export const BUILTIN_THEMES = ["light", "dark", "system"] as const;

export type BuiltinTheme = (typeof BUILTIN_THEMES)[number];

/** Default when nothing is persisted — follow the OS. */
export const DEFAULT_THEME: BuiltinTheme = "system";

/** localStorage key holding the active theme id (builtin id or a custom theme id). */
export const THEME_STORAGE_KEY = "rnd-the-fe/theme";

/** localStorage key holding the JSON array of user-defined custom themes. */
export const CUSTOM_THEMES_STORAGE_KEY = "rnd-the-fe/custom-themes";
