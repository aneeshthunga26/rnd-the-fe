/**
 * The canonical list of themeable CSS variables — the *contract* every theme
 * fills in. Components/utilities reference only these semantic tokens (never raw
 * palette values, never `dark:`), so switching a theme just changes variable
 * values and nothing regenerates. The theme editor iterates this list to render
 * one colour input per token, grouped by `group`.
 */
export const TOKENS = [
  { var: "--color-bg", label: "Background", group: "Surfaces" },
  { var: "--color-surface", label: "Surface", group: "Surfaces" },
  { var: "--color-overlay", label: "Overlay", group: "Surfaces" },
  { var: "--color-line", label: "Border", group: "Surfaces" },
  { var: "--color-row-hover", label: "Row hover", group: "Surfaces" },
  { var: "--color-fg", label: "Text", group: "Text" },
  { var: "--color-muted", label: "Muted text", group: "Text" },
  { var: "--color-brand", label: "Brand", group: "Brand" },
  { var: "--color-brand-hover", label: "Brand (hover)", group: "Brand" },
  { var: "--color-brand-light", label: "Brand (light)", group: "Brand" },
  { var: "--color-on-brand", label: "On-brand text", group: "Brand" },
  { var: "--color-danger", label: "Danger", group: "Status" },
  { var: "--color-success", label: "Success", group: "Status" },
] as const;

/** A themeable CSS variable name (e.g. `"--color-bg"`). */
export type ThemeVar = (typeof TOKENS)[number]["var"];

/** A (partial) map of themeable variable → CSS colour value. */
export type ThemeVars = Partial<Record<ThemeVar, string>>;
