import * as i18n from "@solid-primitives/i18n";
import {
  type Accessor,
  type Component,
  createContext,
  createEffect,
  createMemo,
  createResource,
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

// Bundle trade-off: only the default/base `en` dictionary is bundled (it's the
// fallback, the source of the `Dictionary` key type, and avoids an empty first
// paint). Every other locale loads via dynamic import() so Vite splits it into
// its own chunk fetched only when that locale is first selected.
// A failed chunk fetch (offline, or a stale client requesting an old chunk hash
// after a redeploy) falls back to `en` — the app degrades to English strings
// rather than crashing (a rejected resource would re-throw through every t()).
const LOADERS: Record<Locale, () => Promise<Dictionary>> = {
  en: () => Promise.resolve(en),
  ar: () => import("./dictionaries/ar").then((m) => m.ar).catch(() => en),
  fr: () => import("./dictionaries/fr").then((m) => m.fr).catch(() => en),
};

// The flattened, dotted-key dictionary shape (e.g. "label.status") with `string`
// leaf values — this is what `t` is typed against. Based on the widened
// `Dictionary` (not `typeof en`) so values are `string`, not English literals.
export type FlatDictionary = i18n.Flatten<Dictionary>;

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

  // Reactive dictionary + translator: the resource fetches the active locale's
  // chunk (en resolves synchronously); while a non-default chunk loads, `t`
  // resolves against `en` so there's no flash of raw keys, then updates when the
  // resource settles. Switching locale re-runs every `t(...)` read (fine-grained).
  const [dict] = createResource(locale, (l) => LOADERS[l]());
  const flat = createMemo<FlatDictionary>(() => i18n.flatten<Dictionary>(dict() ?? en));
  const t = i18n.translator(flat, i18n.resolveTemplate);

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
