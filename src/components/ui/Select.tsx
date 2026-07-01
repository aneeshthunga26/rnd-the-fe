import { Select as KSelect } from "@kobalte/core/select";
import { createSignal, type JSX, Show } from "solid-js";
import { ChevronDownIcon } from "../icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown in the trigger before any selection (and after clearing). */
  placeholder?: string;
  /** When true, an empty value is allowed and a "Clear selection" row is shown. */
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  /** Extra classes for the trigger (width, etc.). */
  class?: string;
  "aria-label"?: string;
}

/**
 * Accessible dropdown on Kobalte's `Select` (keyboard nav, focus, aria) — a
 * styled replacement for native `<select>`. Emits the chosen `value` string.
 * Shows `placeholder` until a selection is made; when `clearable`, the panel
 * includes a "Clear selection" row (shown only while a value is set).
 */
export function Select(props: SelectProps): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const selected = () => props.options.find((o) => o.value === props.value) ?? null;

  return (
    <KSelect<SelectOption>
      open={open()}
      onOpenChange={setOpen}
      options={props.options}
      value={selected()}
      onChange={(o) => props.onChange(o?.value ?? "")}
      disabled={props.disabled}
      placeholder={<span class="text-muted">{props.placeholder}</span>}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      disallowEmptySelection={!props.clearable}
      itemComponent={(itemProps) => (
        <KSelect.Item
          item={itemProps.item}
          class="flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm data-[highlighted]:bg-row-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
        >
          <KSelect.ItemLabel>{itemProps.item.rawValue.label}</KSelect.ItemLabel>
        </KSelect.Item>
      )}
    >
      <KSelect.Trigger
        aria-label={props["aria-label"]}
        class={`flex items-center justify-between gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-40 ${
          props.class ?? ""
        }`}
      >
        <KSelect.Value<SelectOption>>
          {(state) => <Show when={state.selectedOption()}>{state.selectedOption().label}</Show>}
        </KSelect.Value>
        <KSelect.Icon>
          <ChevronDownIcon class="h-4 w-4" />
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content class="z-[60] overflow-hidden rounded-lg border border-line bg-bg p-1 shadow-xl">
          <Show when={props.clearable && props.value}>
            <button
              type="button"
              class="flex w-full items-center rounded px-3 py-2 text-start text-sm text-muted hover:bg-row-hover"
              onClick={() => {
                props.onChange("");
                setOpen(false);
              }}
            >
              {props.clearLabel ?? "Clear selection"}
            </button>
            <div class="my-1 h-px bg-line" />
          </Show>
          <KSelect.Listbox class="max-h-60 overflow-y-auto" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  );
}
