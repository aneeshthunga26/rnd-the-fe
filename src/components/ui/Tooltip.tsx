import { Tooltip as KTooltip } from "@kobalte/core/tooltip";
import type { JSX, ParentComponent } from "solid-js";

interface TooltipProps {
  /** Content shown in the floating panel. */
  content: JSX.Element;
  placement?: "top" | "bottom" | "left" | "right";
}

/**
 * Accessible tooltip on Kobalte's `Tooltip`. The trigger (children) is a button,
 * so the panel opens on hover and on focus/click (keyboard and pointer). Content
 * wraps; keep it short.
 */
export const Tooltip: ParentComponent<TooltipProps> = (props) => (
  <KTooltip placement={props.placement ?? "top"} openDelay={100} closeDelay={100} gutter={6}>
    <KTooltip.Trigger class="inline-flex items-center focus:outline-none">
      {props.children}
    </KTooltip.Trigger>
    <KTooltip.Portal>
      <KTooltip.Content class="z-[70] max-w-xs whitespace-pre-wrap rounded-lg border border-line bg-bg px-3 py-2 text-xs text-fg shadow-xl">
        <KTooltip.Arrow />
        {props.content}
      </KTooltip.Content>
    </KTooltip.Portal>
  </KTooltip>
);
