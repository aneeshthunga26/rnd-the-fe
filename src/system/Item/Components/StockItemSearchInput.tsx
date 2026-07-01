import { type Component } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { createDebounced, resolvePick } from "../../../components/inputs/comboboxUtil";
import { useStockItems, type ItemStockOnHandRow } from "../api";

interface Props {
  value: ItemStockOnHandRow | null;
  onChange: (value: ItemStockOnHandRow | null) => void;
  /** Item ids to exclude (e.g. items already in the stocktake). */
  excludeIds?: string[];
  disabled?: boolean;
  width?: string;
}

/** Stock-item picker (visible or on-hand STOCK items), searched by code/name. */
export const StockItemSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useStockItems(search, () => props.excludeIds);

  const rows = () => query.data ?? [];
  const label = (i: ItemStockOnHandRow) => `${i.code} ${i.name}`;
  const options = () =>
    rows().map((i) => ({ value: i.id, label: label(i), detail: i.unitName ?? undefined }));
  const selected = () => (props.value ? { value: props.value.id, label: label(props.value) } : null);

  return (
    <AsyncCombobox
      serverSide
      value={selected()}
      options={options()}
      loading={query.isFetching}
      onInputChange={setSearch}
      onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
      placeholder="Search items…"
      disabled={props.disabled}
      width={props.width}
    />
  );
};
