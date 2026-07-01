import { type Component } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { createDebounced, resolvePick } from "../../../components/inputs/comboboxUtil";
import { useLocations, type LocationRow } from "../api";

interface Props {
  value: LocationRow | null;
  onChange: (value: LocationRow | null) => void;
  /** Restrict to one location type (from an item's `restrictedLocationTypeId`). */
  restrictedToLocationTypeId?: string | null;
  disabled?: boolean;
  invalid?: boolean;
  width?: string;
}

/** Location picker, optionally restricted to a location type. Label = `code - name (type)`. */
export const LocationSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useLocations(() => props.restrictedToLocationTypeId, search);

  const rows = () => query.data ?? [];
  const label = (l: LocationRow) =>
    `${l.code} - ${l.name}${l.locationType ? ` (${l.locationType.name})` : ""}`;
  const options = () => rows().map((l) => ({ value: l.id, label: label(l) }));
  const selected = () => (props.value ? { value: props.value.id, label: label(props.value) } : null);

  return (
    <AsyncCombobox
      serverSide
      value={selected()}
      options={options()}
      loading={query.isFetching}
      onInputChange={setSearch}
      onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
      placeholder="Select location…"
      disabled={props.disabled}
      invalid={props.invalid}
      width={props.width}
    />
  );
};
