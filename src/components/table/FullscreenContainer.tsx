import { type JSX, Show } from "solid-js";

/**
 * When `isFullscreen`, renders its children in a fixed overlay covering the whole
 * viewport (over the app chrome); otherwise renders them inline. Wrap only the
 * table region (toolbar buttons + DataTable + pagination) so fullscreen shows
 * just those.
 */
export function FullscreenContainer(props: { isFullscreen: boolean; children: JSX.Element }): JSX.Element {
  return (
    <Show when={props.isFullscreen} fallback={<>{props.children}</>}>
      <div class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-page p-4">{props.children}</div>
    </Show>
  );
}
