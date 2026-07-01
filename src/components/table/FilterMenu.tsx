import { Popover } from "@kobalte/core/popover";
import { type Component, createSignal, For, Show } from "solid-js";
import { ChevronDownIcon } from "../icons";
import { useI18n } from "../../intl";

export interface FilterDef {
  /** Stable key identifying the filter (matches the URL param). */
  key: string;
  /** Translated label shown in the menu. */
  label: string;
}

interface FilterMenuProps {
  /** Every filter that can be added. */
  available: FilterDef[];
  /** Keys of the currently-active filters. */
  active: string[];
  /** Activate a filter by key. */
  onAdd: (key: string) => void;
  /** Remove every active filter (back to the original, filter-less state). */
  onClearAll: () => void;
}

/**
 * The "Filters" dropdown. Lists the filters not yet added; picking one activates
 * it (and reveals its control). Once any filter is active it drops out of the
 * list and a "Remove all filters" row appears, which clears the active set.
 */
export const FilterMenu: Component<FilterMenuProps> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const addable = () => props.available.filter((f) => !props.active.includes(f.key));

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start" gutter={4}>
      <Popover.Trigger class="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg hover:bg-row-hover">
        {t("label.filters")}
        <ChevronDownIcon class="w-4 h-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content class="z-50 min-w-[12rem] overflow-hidden rounded-lg border border-line bg-bg text-sm text-fg shadow-xl focus:outline-none">
          <div class="py-1">
            <For each={addable()}>
              {(f) => (
                <button
                  type="button"
                  class="flex w-full items-center px-3 py-2 text-start hover:bg-row-hover"
                  onClick={() => {
                    props.onAdd(f.key);
                    setOpen(false);
                  }}
                >
                  {f.label}
                </button>
              )}
            </For>
            <Show when={props.active.length > 0}>
              <Show when={addable().length > 0}>
                <div class="my-1 h-px bg-line" />
              </Show>
              <button
                type="button"
                class="flex w-full items-center px-3 py-2 text-start text-danger hover:bg-row-hover"
                onClick={() => {
                  props.onClearAll();
                  setOpen(false);
                }}
              >
                {t("action.remove-all-filters")}
              </button>
            </Show>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
};
