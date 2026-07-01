import { createSignal, onCleanup, onMount } from "solid-js";

/** Signal-based fullscreen toggle (CSS overlay approach; Esc closes). */
export function useFullscreen() {
  const [isFullscreen, setFullscreen] = createSignal(false);

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  return {
    isFullscreen,
    setFullscreen,
    toggle: () => setFullscreen((v) => !v),
  };
}
