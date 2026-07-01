import { useContext } from "solid-js";
import { I18nContext, type I18nContextValue } from "./I18nProvider";

/** Access the i18n context. Throws if used outside an `<I18nProvider>`. */
export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an <I18nProvider>");
  }
  return ctx;
};
