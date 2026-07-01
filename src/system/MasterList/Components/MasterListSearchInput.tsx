import { type Component } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { createDebounced, resolvePick } from "../../../components/inputs/comboboxUtil";
import { useMasterLists, type MasterListRow } from "../api";

interface Props {
  value: MasterListRow | null;
  onChange: (value: MasterListRow | null) => void;
  disabled?: boolean;
  width?: string;
}

/** Master-list picker (lists that exist for this store), searched by name. */
export const MasterListSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useMasterLists(search);

  const rows = () => query.data ?? [];
  const options = () => rows().map((m) => ({ value: m.id, label: m.name, detail: m.code ?? undefined }));
  const selected = () => (props.value ? { value: props.value.id, label: props.value.name } : null);

  return (
    <AsyncCombobox
      serverSide
      value={selected()}
      options={options()}
      loading={query.isFetching}
      onInputChange={setSearch}
      onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
      placeholder="Search master lists…"
      disabled={props.disabled}
      width={props.width}
    />
  );
};
