// i18n configuration: supported locales, direction, persistence, labels.
// Keep this dependency-free so both the provider and format helpers can import it.

export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// Right-to-left locales. Add "he", "fa", "ur" here when introduced.
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export const isRtl = (l: Locale): boolean => RTL_LOCALES.includes(l);

export const dirFor = (l: Locale): "rtl" | "ltr" => (isRtl(l) ? "rtl" : "ltr");

export const LOCALE_STORAGE_KEY = "rnd-the-fe/locale";

// Native language names (shown in the switcher, always in their own script).
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
};

/** Narrow an arbitrary string to a supported Locale, else undefined. */
export const asLocale = (value: string | null | undefined): Locale | undefined =>
  value && (LOCALES as readonly string[]).includes(value) ? (value as Locale) : undefined;

/**
 * Match a `navigator.language`-style tag (e.g. "en-GB", "ar", "fr-DJ") to a
 * supported locale by its primary subtag. Returns undefined if unsupported.
 */
export const matchLocale = (tag: string | null | undefined): Locale | undefined => {
  if (!tag) return undefined;
  const primary = tag.toLowerCase().split("-")[0];
  return asLocale(primary);
};
