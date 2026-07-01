import * as i18n from "@solid-primitives/i18n";
import {
  type Accessor,
  type Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
} from "solid-js";
import {
  asLocale,
  DEFAULT_LOCALE,
  dirFor,
  type Locale,
  LOCALE_STORAGE_KEY,
  LOCALES,
  matchLocale,
} from "./config";
import { type Dictionary, en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import { fr } from "./dictionaries/fr";

// NOTE (bundle trade-off): all locale dictionaries are statically imported, so
// the initial bundle carries every translation up front. For 3 small
// dictionaries this is negligible and keeps switching synchronous (no flash,
// no loading state). If the set of locales grows large, switch to per-locale
// dynamic import() driven by a resource in this provider.
// The flattened, dotted-key dictionary shape (e.g. "label.status") with `string`
// leaf values — this is what `t` is typed against. Based on the widened
// `Dictionary` (not `typeof en`) so values are `string`, not English literals.
export type FlatDictionary = i18n.Flatten<Dictionary>;

const DICTIONARIES: Record<Locale, FlatDictionary> = {
  en: i18n.flatten<Dictionary>(en),
  ar: i18n.flatten(ar),
  fr: i18n.flatten(fr),
};

export type Translator = i18n.Translator<FlatDictionary>;

export interface I18nContextValue {
  t: Translator;
  locale: Accessor<Locale>;
  setLocale: (locale: Locale) => void;
  dir: Accessor<"rtl" | "ltr">;
  locales: readonly Locale[];
}

export const I18nContext = createContext<I18nContextValue>();

// Resolve the initial locale: persisted choice → browser language → default.
const initialLocale = (): Locale => {
  if (typeof localStorage !== "undefined") {
    const stored = asLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (stored) return stored;
  }
  if (typeof navigator !== "undefined") {
    const fromNav = matchLocale(navigator.language);
    if (fromNav) return fromNav;
  }
  return DEFAULT_LOCALE;
};

export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  const [locale, setLocaleSignal] = createSignal<Locale>(initialLocale());

  const setLocale = (next: Locale): void => {
    setLocaleSignal(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
  };

  // Reactive dictionary + translator: switching `locale()` swaps the dict memo,
  // which re-runs every `t(...)` read across the app (fine-grained, no manual work).
  const dict = createMemo(() => DICTIONARIES[locale()]);
  const t = i18n.translator(dict, i18n.resolveTemplate);

  const dir = createMemo<"rtl" | "ltr">(() => dirFor(locale()));

  // Reflect language + direction onto <html> so Tailwind's rtl:/logical
  // utilities and native browser behaviour pick it up.
  createEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.lang = locale();
    root.dir = dir();
  });

  const value: I18nContextValue = {
    t,
    locale,
    setLocale,
    dir,
    locales: LOCALES,
  };

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
};
