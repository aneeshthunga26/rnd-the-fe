import { type Component, Show } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { resolvePick } from "../../../components/inputs/comboboxUtil";
import { usePreferences } from "../../../preferences";
import { useActiveVvmStatuses, type VvmStatusRow } from "../api";

interface Props {
  value: VvmStatusRow | null;
  onChange: (value: VvmStatusRow | null) => void;
  disabled?: boolean;
  width?: string;
}

/**
 * VVM status picker. Preference-gated: renders nothing unless
 * `manageVvmStatusForStock` is enabled (mirrors `useVvmStatusesEnabled`).
 */
export const VVMStatusSearchInput: Component<Props> = (props) => {
  const prefs = usePreferences();
  const enabled = () => !!prefs().manageVvmStatusForStock;

  const query = useActiveVvmStatuses(enabled);

  const rows = () => query.data ?? [];
  const options = () => rows().map((v) => ({ value: v.id, label: v.description }));
  const selected = () => (props.value ? { value: props.value.id, label: props.value.description } : null);

  return (
    <Show when={enabled()}>
      <AsyncCombobox
        value={selected()}
        options={options()}
        loading={query.isFetching}
        onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
        placeholder="Select VVM status…"
        disabled={props.disabled}
        width={props.width}
      />
    </Show>
  );
};
