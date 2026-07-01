import { Popover } from "@kobalte/core/popover";
import { type Component, type JSX, Show } from "solid-js";

interface MenuProps {
  /** Content shown inside the trigger button (e.g. an icon). */
  trigger: JSX.Element;
  /** Classes for the trigger button (match the surrounding toolbar buttons). */
  triggerClass?: string;
  triggerTitle?: string;
  /** Optional header shown at the top of the panel. */
  title?: JSX.Element;
  /** Panel content. */
  children: JSX.Element;
  /** Panel width (CSS value). */
  width?: string;
  placement?: "bottom-start" | "bottom-end" | "bottom";
}

/**
 * Generic popover menu on Kobalte's accessible `Popover` — a trigger button plus
 * a floating panel of arbitrary content (toggles, action rows). Used by the
 * columns picker and table-settings menus.
 */
export const Menu: Component<MenuProps> = (props) => (
  <Popover placement={props.placement ?? "bottom-end"} gutter={4}>
    <Popover.Trigger class={props.triggerClass} title={props.triggerTitle}>
      {props.trigger}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        class="z-50 overflow-hidden rounded-lg border border-line bg-page text-sm text-gray-menu shadow-xl focus:outline-none"
        style={{ width: props.width ?? "16rem" }}
      >
        <Show when={props.title}>
          <div class="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-muted">
            {props.title}
          </div>
        </Show>
        <div class="max-h-[70vh] overflow-auto py-1">{props.children}</div>
      </Popover.Content>
    </Popover.Portal>
  </Popover>
);

/** A clickable action row for a Menu panel. */
export const MenuItem: Component<{
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: JSX.Element;
}> = (props) => (
  <button
    type="button"
    disabled={props.disabled}
    onClick={() => props.onClick()}
    class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-40"
    classList={{ "text-red-600": props.tone === "danger" }}
  >
    {props.children}
  </button>
);

/** A thin divider between menu sections. */
export const MenuSeparator: Component = () => <div class="my-1 h-px bg-line" />;
