import { type Component } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import App from "../App";
import { ThemeProvider } from "../theme";
import { I18nProvider } from "../intl";

const queryClient = new QueryClient();

/**
 * App-wide provider composition (outer → inner):
 *   QueryClientProvider  – server-state cache (existing)
 *   ThemeProvider        – applies data-theme / custom vars on <html>
 *   I18nProvider         – sets <html lang/dir>, provides t()
 *   App                  – the Router + routes
 *
 * Router-scoped providers (e.g. ShortcutsProvider, which needs useNavigate)
 * mount INSIDE the Router via `AppRoot` in App.tsx, not here.
 */
export const Providers: Component = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
