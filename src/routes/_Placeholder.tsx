import type { Component } from "solid-js";

/** Generic "coming soon" screen. The title is rendered by the layout's header. */
export const Placeholder: Component<{ title: string }> = (props) => (
  <div class="flex flex-1 items-center justify-center text-gray-muted">
    <p>{props.title} — coming soon</p>
  </div>
);
