import { createSignal, onCleanup } from "solid-js";
import { screenDown } from "./breakpoints";

/** Reactive boolean for a CSS media query. Call inside a component. */
export function createMediaQuery(query: string) {
  const mql = window.matchMedia(query);
  const [matches, setMatches] = createSignal(mql.matches);

  const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
  mql.addEventListener("change", onChange);
  onCleanup(() => mql.removeEventListener("change", onChange));

  return matches;
}

/** True when the viewport is narrower than the `md` breakpoint (mobile/tablet). */
export const useIsMobile = () => createMediaQuery(screenDown("md"));
