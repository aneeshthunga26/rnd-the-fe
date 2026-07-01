// Barrel for the i18n module. Screens/components import from here; nothing
// reaches into individual files.

export {
  LOCALES,
  DEFAULT_LOCALE,
  RTL_LOCALES,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  isRtl,
  dirFor,
  asLocale,
  matchLocale,
} from "./config";
export type { Locale } from "./config";

export { I18nProvider, I18nContext } from "./I18nProvider";
export type { I18nContextValue, Translator, FlatDictionary } from "./I18nProvider";

export { useI18n } from "./useI18n";

export { useFormat, makeFormatters } from "./format";
export type { Formatters } from "./format";

export type { Dictionary } from "./dictionaries/en";
