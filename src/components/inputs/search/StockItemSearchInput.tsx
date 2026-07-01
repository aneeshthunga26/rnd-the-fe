import { type Component } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { AsyncCombobox } from "../AsyncCombobox";
import { ItemStockOnHandFragment, ItemsDocument, type ItemStockOnHandRow } from "./operations";
import { createDebounced, resolvePick } from "./util";

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
  const query = useQuery(() => ({
    queryKey: ["items", STORE_ID, search(), (props.excludeIds ?? []).join(",")],
    queryFn: async () => {
      const data = await request(ItemsDocument, {
        storeId: STORE_ID,
        first: 100,
        filter: {
          type: { equalTo: "STOCK" },
          isActive: true,
          isVisibleOrOnHand: true,
          ...(search() ? { codeOrName: { like: search() } } : {}),
          ...(props.excludeIds?.length ? { id: { notEqualAll: props.excludeIds } } : {}),
        },
      });
      return [...readFragment(ItemStockOnHandFragment, data.items.nodes)];
    },
  }));

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
