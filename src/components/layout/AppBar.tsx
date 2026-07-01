import type { Component, JSX } from "solid-js";

interface AppBarProps {
  title: string;
  icon?: JSX.Element;
  /** Right-aligned action buttons. */
  actions?: JSX.Element;
}

/** Top page header: section icon + title on the left, actions on the right. */
export const AppBar: Component<AppBarProps> = (props) => (
  <div class="flex min-h-[72px] items-center justify-between gap-4 px-6 py-4">
    <div class="flex items-center gap-3">
      <span class="text-gray-menu">{props.icon}</span>
      <h1 class="text-xl font-semibold">{props.title}</h1>
    </div>
    <div class="flex items-center gap-2">{props.actions}</div>
  </div>
);
