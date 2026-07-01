import { type Component } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { createDebounced, resolvePick } from "../../../components/inputs/comboboxUtil";
import { useNames, type NameRow } from "../api";

interface Props {
  value: NameRow | null;
  onChange: (value: NameRow | null) => void;
  disabled?: boolean;
  width?: string;
}

/** Donor picker (names with `isDonor`). On-hold donors are non-selectable. */
export const DonorSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useNames("donor", search);

  const rows = () => query.data ?? [];
  const options = () =>
    rows().map((n) => ({ value: n.id, label: n.name, detail: n.code ?? undefined, disabled: n.isOnHold }));
  const selected = () => (props.value ? { value: props.value.id, label: props.value.name } : null);

  return (
    <AsyncCombobox
      serverSide
      value={selected()}
      options={options()}
      loading={query.isFetching}
      onInputChange={setSearch}
      onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
      placeholder="Select donor…"
      disabled={props.disabled}
      width={props.width}
    />
  );
};
