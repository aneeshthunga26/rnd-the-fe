import { Combobox } from "@kobalte/core/combobox";
import { type JSX, Show } from "solid-js";
import { ChevronDownIcon, CloseIcon } from "../icons";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text shown after the label. */
  detail?: string;
  disabled?: boolean;
}

interface AsyncComboboxProps {
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
  options: ComboboxOption[];
  /** Fired (debounce yourself) as the user types — use for server-side search. */
  onInputChange?: (text: string) => void;
  /** When true, options are assumed pre-filtered by the server (no client filtering). */
  serverSide?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Show an error ring (e.g. invalid selection). */
  invalid?: boolean;
  /** Allow clearing the selection. Defaults to true. */
  clearable?: boolean;
  width?: string;
}

/**
 * Generic, accessible combobox on Kobalte. Works with a normalized
 * `{ value, label }` option shape; entity inputs map their nodes to options and
 * resolve the picked option back to the node. Supports server-side search via
 * `onInputChange` + `serverSide`.
 */
export function AsyncCombobox(props: AsyncComboboxProps): JSX.Element {
  return (
    <Combobox<ComboboxOption>
      options={props.options}
      value={props.value}
      onChange={(v) => props.onChange(v)}
      onInputChange={props.onInputChange}
      disabled={props.disabled}
      placeholder={props.placeholder}
      optionValue={(o) => o.value}
      optionTextValue={(o) => o.label}
      optionLabel={(o) => o.label}
      optionDisabled={(o) => !!o.disabled}
      defaultFilter={props.serverSide ? () => true : "contains"}
      allowsEmptyCollection
      itemComponent={(itemProps) => (
        <Combobox.Item
          item={itemProps.item}
          class="flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm data-[highlighted]:bg-row-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
        >
          <Combobox.ItemLabel>{itemProps.item.rawValue.label}</Combobox.ItemLabel>
          <Show when={itemProps.item.rawValue.detail}>
            <span class="text-xs text-gray-muted">{itemProps.item.rawValue.detail}</span>
          </Show>
        </Combobox.Item>
      )}
    >
      <Combobox.Control<ComboboxOption>
        class="flex items-center rounded-lg border bg-page text-sm"
        classList={{ "border-red-500": props.invalid, "border-line": !props.invalid }}
        style={{ width: props.width }}
      >
        {(state) => (
          <>
            <Combobox.Input class="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2 outline-none" />
            <Show when={(props.clearable ?? true) && state.selectedOptions().length > 0}>
              <button
                type="button"
                class="px-1 text-gray-muted hover:text-[#3a3d44]"
                aria-label="Clear"
                onClick={() => {
                  state.clear();
                  props.onChange(null);
                }}
              >
                <CloseIcon class="h-4 w-4" />
              </button>
            </Show>
            <Combobox.Trigger class="px-2 text-gray-muted" aria-label="Toggle options">
              <Combobox.Icon>
                <ChevronDownIcon class="h-4 w-4" />
              </Combobox.Icon>
            </Combobox.Trigger>
          </>
        )}
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Content class="z-[60] max-h-60 w-[var(--kb-popper-anchor-width)] overflow-y-auto rounded-lg border border-line bg-page p-1 shadow-xl">
          <Show when={props.loading}>
            <div class="px-3 py-2 text-sm text-gray-muted">Loading…</div>
          </Show>
          <Combobox.Listbox />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}
