// Global breakpoints (px). Single source of truth for JS media-query logic.
// Kept in sync with the `--breakpoint-*` tokens in src/index.css (Tailwind variants).
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Media query matching viewports at least `bp` wide. */
export const screenUp = (bp: Breakpoint) => `(min-width: ${BREAKPOINTS[bp]}px)`;

/** Media query matching viewports narrower than `bp`. */
export const screenDown = (bp: Breakpoint) => `(max-width: ${BREAKPOINTS[bp] - 1}px)`;
