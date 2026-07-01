import { For, type JSX, Show } from "solid-js";

export interface FooterAction {
  label: string;
  icon?: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  /** Optional tooltip (e.g. explaining why the action is disabled). */
  title?: string;
}

interface SelectionFooterProps {
  count: number;
  actions: FooterAction[];
  onClear: () => void;
}

/**
 * Below-table footer shown while rows are selected: "N selected", action buttons
 * on the leading side, "Clear selection" on the trailing side. Renders nothing
 * when nothing is selected. Reusable across list and detail tables.
 */
export function SelectionFooter(props: SelectionFooterProps): JSX.Element {
  return (
    <Show when={props.count > 0}>
      <div class="flex items-center gap-4 border-t border-line bg-page px-4 py-2.5 text-sm">
        <span class="font-medium text-[#3a3d44]">{props.count} selected</span>
        <div class="flex items-center gap-2">
          <For each={props.actions}>
            {(action) => (
              <button
                type="button"
                title={action.title}
                disabled={action.disabled}
                onClick={() => action.onClick()}
                class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                classList={{
                  "border-red-500 text-red-600 hover:bg-red-50": action.tone === "danger",
                  "border-brand text-brand hover:bg-brand-light": action.tone !== "danger",
                }}
              >
                {action.icon}
                {action.label}
              </button>
            )}
          </For>
        </div>
        <button
          type="button"
          onClick={() => props.onClear()}
          class="ms-auto text-gray-menu hover:text-[#3a3d44] hover:underline"
        >
          Clear selection
        </button>
      </div>
    </Show>
  );
}
