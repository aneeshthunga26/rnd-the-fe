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

/** Manufacturer picker (names with `isManufacturer`). On-hold names non-selectable. */
export const ManufacturerSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useNames("manufacturer", search);

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
      placeholder="Select manufacturer…"
      disabled={props.disabled}
      width={props.width}
    />
  );
};
