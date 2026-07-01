import { type Component } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { AsyncCombobox } from "../AsyncCombobox";
import { NameRowFragment, NamesDocument, type NameRow } from "./operations";
import { createDebounced, resolvePick } from "./util";

interface Props {
  value: NameRow | null;
  onChange: (value: NameRow | null) => void;
  disabled?: boolean;
  width?: string;
}

/** Donor picker (names with `isDonor`). On-hold donors are non-selectable. */
export const DonorSearchInput: Component<Props> = (props) => {
  const [search, setSearch] = createDebounced();
  const query = useQuery(() => ({
    queryKey: ["names", "donors", STORE_ID, search()],
    queryFn: async () => {
      const data = await request(NamesDocument, {
        storeId: STORE_ID,
        first: 1000,
        filter: { isDonor: true, isVisible: true, ...(search() ? { codeOrName: { like: search() } } : {}) },
      });
      return [...readFragment(NameRowFragment, data.names.nodes)];
    },
  }));

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
