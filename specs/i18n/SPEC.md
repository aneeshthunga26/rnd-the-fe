# Spec — Internationalisation (translations) + RTL (Arabic)

> Lives at `specs/i18n/`. Largely **independent** of the stocktakes port (`specs/stocktakes/`) and
> **parallel-safe** with the theming spec (`specs/theming/`) — see `../conventions.md` and "Coordination".

Target repo: `/Users/aneesh/Projects/rnd-the-fe` (Solid 1.9, Vite, Tailwind v4). Read `CLAUDE.md` first —
it already commits to `@solid-primitives/i18n`, native `Intl`, and logical CSS for RTL. This spec makes that
concrete and adds Arabic/RTL.

> **Scope & parallelism (read `../conventions.md`).** This is **i18n-infra**: it owns `src/intl/**`,
> `src/components/inputs/LanguageSelect.tsx`, and the `StoreBar.tsx` switcher edit — a **disjoint** file set
> from **theming-infra**, so the two run **in parallel**. The app-wide **component string/RTL sweep** and the
> **provider mounting** are NOT in this spec — they're the shared unit in `../conventions.md`, run once after
> both infra tracks (and after the stocktakes port). Here you build the i18n machinery + dictionaries; the
> sweep later wraps component strings with the `t()` this spec provides.

## Recommendation: is `@solid-primitives/i18n` a good fit?

**Yes — use `@solid-primitives/i18n@^2.2.1`** (peer `solid-js ^1.6.12`, so fine on our 1.9; do **not** use
the `3.0.0-next` prerelease — that's the Solid-2.0 era). Why it fits our goals:
- **Tiny + tree-shakeable** (small-bundle goal): it's a handful of pure functions, no provider/runtime baggage.
- **Reactive + type-safe**: `translator(dict, resolveTemplate)` is just a function over a reactive dict memo,
  so locale switches update the UI with no extra machinery; keys are typed from the dictionary object.
- **Unopinionated**: you own the locale signal and dictionaries → clean to wire into our existing context
  patterns (like `PageHeader`).

**What it does NOT do (we implement these):**
- **No number/date formatting** → use native **`Intl`** (zero bundle cost), wrapped in locale-aware helpers.
- **No RTL / direction handling** → we set `dir`/`lang` on `<html>` + use Tailwind logical utilities.
- **No locale detection/persistence** → we add a small provider (localStorage + `navigator.language`).

Verified v2 public API (confirm against the installed version): `flatten`, `translator`, `resolveTemplate`,
`chainedTranslator`, `scopedTranslator`, `prefix`, `proxyTranslator`. Template syntax: `"hello {{ name }}"`.

Alternatives considered: `i18next` (+ solid binding) is heavier and more than we need; a hand-rolled solution
loses the typed template/resolver ergonomics. Stick with `@solid-primitives/i18n` + `Intl`.

## Dependencies

```
pnpm add @solid-primitives/i18n@^2.2.1
```
(No other runtime deps — formatting is native `Intl`; direction is CSS + a `dir` attribute.)

## Architecture / files

```
src/intl/
  config.ts          # LOCALES, RTL_LOCALES, DEFAULT_LOCALE, localStorage key, isRtl(locale)
  dictionaries/
    en.ts            # the base dictionary (source of truth for the key type)
    ar.ts            # Arabic (RTL)
    fr.ts            # (optional example LTR)
  I18nProvider.tsx   # context: locale signal (persisted) + reactive translator + dir; sets <html lang/dir>
  useI18n.ts         # hook: { t, locale, setLocale, dir, locales }
  format.ts          # Intl helpers bound to the current locale (number, currency, date, dateTime, relative, list, plural)
  index.ts           # barrel
src/components/inputs/LanguageSelect.tsx   # language switcher (used in StoreBar / settings)
```

### `config.ts`

```ts
export const LOCALES = ["en", "ar", "fr"] as const;      // extend as needed
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["ar"];    // add he, fa, ur when introduced
export const isRtl = (l: Locale) => RTL_LOCALES.includes(l);
export const LOCALE_STORAGE_KEY = "rnd-the-fe/locale";
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", ar: "العربية", fr: "Français" };
```

### Dictionaries + type safety

- `dictionaries/en.ts` is the **base**; its shape defines the key type. Use a flat or nested object; if
  nested, `flatten()` it. Derive the type so `t` is checked:
  ```ts
  // en.ts
  export const en = {
    "app.stocktakes": "Stocktakes",
    "label.status": "Status",
    "action.new-stocktake": "New stocktake",
    "message.deleted-count": "Deleted {{ count }} stocktakes",
    // …
  } as const;
  export type Dictionary = Record<keyof typeof en, string>;   // other locales must satisfy this
  ```
  `ar.ts`, `fr.ts` are typed `: Dictionary` so missing keys are compile errors.
- **Lazy-load** non-default dictionaries to keep the initial bundle small: dynamic `import()` per locale via a
  resource/signal in the provider (English bundled; others fetched on switch). For a first pass, static
  imports of 2-3 locales is acceptable — note the trade-off.

### `I18nProvider.tsx`

Export `I18nProvider` — **mounting is owned by the integration step in `../conventions.md`** (`src/app/Providers.tsx`);
do not edit `src/index.tsx` in this spec (for local testing you may temporarily wrap `<App/>` and revert).
Responsibilities:
1. `locale` signal, initialised from `localStorage[LOCALE_STORAGE_KEY]` → else `navigator.language` matched to
   `LOCALES` → else `DEFAULT_LOCALE`. `setLocale` persists to localStorage.
2. Load the dictionary for the current locale (lazy) and build the reactive translator:
   ```ts
   const dict = createMemo(() => i18n.flatten(dictionaries[locale()]));   // or from a resource when lazy
   const t = i18n.translator(dict, i18n.resolveTemplate);
   ```
3. `createEffect` sets `document.documentElement.lang = locale()` and
   `document.documentElement.dir = isRtl(locale()) ? "rtl" : "ltr"`.
4. Provide `{ t, locale, setLocale, dir: () => (isRtl(locale()) ? "rtl" : "ltr"), locales: LOCALES }` via context.
- `useI18n()` reads the context (throws if outside provider). Components call `const { t } = useI18n(); t("label.status")`.

### `format.ts` — native `Intl`, locale-aware

Helpers that read the current locale (via a passed locale or a light `useI18n`), memoising `Intl.*Format`
instances:
```ts
formatNumber(n, opts?)            // Intl.NumberFormat(locale, opts)
formatCurrency(n, currency)       // Intl.NumberFormat(locale, { style:"currency", currency })
formatDate(d) / formatDateTime(d) // Intl.DateTimeFormat(locale, …)
formatRelativeTime(value, unit)   // Intl.RelativeTimeFormat
formatList(items)                 // Intl.ListFormat
plural(n)                         // Intl.PluralRules (pair with dictionary plural keys)
```
Notes:
- For Arabic, `Intl.NumberFormat("ar")` yields Arabic-Indic digits by default; force Western digits with the
  `ar-u-nu-latn` locale if the design calls for it — make this a config choice.
- Replace the ad-hoc `formatDate` in `src/routes/inventory/stocktakes/columns.tsx` with `formatDate` here.

## RTL handling (Arabic)

`@solid-primitives/i18n` doesn't do RTL — it's a layout concern. Split:

1. **Direction attribute (this spec / i18n-infra):** the `I18nProvider` sets `<html dir="rtl" lang="…">` for
   RTL locales (see above). Tailwind v4's `rtl:`/`ltr:` variants + logical utilities key off this
   automatically. That's all i18n-infra does for RTL.
2. **Making the components mirror (the shared sweep — NOT this spec):** converting physical→logical CSS
   (`ml/mr`→`ms/me`, `left/right`→`start/end`, `border-l/r`→`border-s/e`, etc.), mirroring directional icons
   (`rtl:-scale-x-100`), and fixing left-anchored panels (`MobileDrawer` etc.) across all shared components is
   done **once** by the component sweep in `../conventions.md` (it also does the theming token conversion and
   `t()` wrapping in the same pass, so each file is touched once). Do **not** do that audit here.

## Language switcher

`src/components/inputs/LanguageSelect.tsx` — a small select/menu (reuse the `Menu` primitive from the
stocktakes `00-foundation`, or Kobalte Select/DropdownMenu) listing `LOCALES` with `LOCALE_LABELS`, calling
`setLocale`. Selecting an item switches the language (and `dir`) live.

**Wire it into the existing "English" footer stub.** Today `src/components/layout/StoreBar.tsx` renders a
**static, non-interactive** "English" element (a `<span>`/dummy button with `LanguageIcon`, in both the
`sidebar` variant — desktop sidebar footer — and the `bar` variant — mobile bottom bar). Replace that stub in
**both variants** with `LanguageSelect` (or make the existing element the menu trigger):
- It must be **clickable** and **open the language menu** (dropdown/popover anchored to it).
- The label shows the **current** language via `LOCALE_LABELS[locale()]` (so it reads "English" / "العربية"
  reactively, not a hardcoded "English").
- Choosing a language calls `setLocale`, which persists it and updates `<html lang/dir>` + all `t(...)`
  strings immediately.
- Keep the current styling/placement (icon + label in the footer row); only its behaviour changes from
  static → interactive.

## Dictionaries (this spec) vs wrapping component strings (the sweep)

i18n-infra **provides** the dictionaries + `t()`; the actual wrapping of component strings is the shared sweep
(`../conventions.md`). So here: seed `en.ts` (+ `ar.ts`, `fr.ts`) with the keys the app needs, namespaced
`label.* action.* message.* status.*`, mirroring open-mSupply's key style so Arabic can be sourced from its
locale files (`/Users/aneesh/Projects/open-msupply/client/packages/common/src/intl/locales/`). The sweep then
replaces hardcoded strings with `t("…")`, and converts `routeMeta.ts` titles into keys translated in the
AppBar/MobileHeader. Don't edit those shared components in this spec.

## Coordination / parallelism

- **Parallel-safe with theming-infra**: disjoint files (see `../conventions.md` matrix — i18n owns `src/intl/**`
  + `LanguageSelect` + the `StoreBar` switcher; theming owns `src/theme/**` + `index.css` + `index.html` +
  Settings). Run them concurrently.
- **Provider mount + component sweep** are the shared unit in `../conventions.md`, run **after** both infra
  tracks and **after** the stocktakes port (so the sweep touches those files once). Don't touch `index.tsx`
  or shared components here.

## Acceptance / verification (i18n-infra)

- `pnpm typecheck` + `pnpm build` pass; non-English dictionaries are type-checked against `Dictionary` (missing
  keys fail the build).
- With `I18nProvider` mounted (temporarily, for testing): switching locale via `LanguageSelect` in `StoreBar`
  updates its label reactively and sets `<html dir/lang>` (Arabic → `dir="rtl"`); `format.ts` helpers produce
  locale-correct numbers/dates. (Full-app mirroring/translation is validated after the `conventions.md` sweep.)
- Bundle stays small: `@solid-primitives/i18n` adds only a few KB; non-default dictionaries are lazy-loaded.
```
