import { type ThemeContextValue, useThemeContext } from "./ThemeProvider";

/**
 * Access the theming API: `{ themeId, setTheme, themes, customThemes,
 * saveCustomTheme, deleteCustomTheme, reapply }`. Throws if used outside
 * `ThemeProvider`.
 */
export const useTheme = (): ThemeContextValue => useThemeContext();
