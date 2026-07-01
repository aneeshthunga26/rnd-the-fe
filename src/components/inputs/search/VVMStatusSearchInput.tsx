import { type Component, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { AsyncCombobox } from "../AsyncCombobox";
import { usePreferences } from "../usePreferences";
import { ActiveVvmStatusesDocument, VvmStatusFragment, type VvmStatusRow } from "./operations";
import { resolvePick } from "./util";

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

  const query = useQuery(() => ({
    queryKey: ["vvmStatuses", STORE_ID],
    queryFn: async () => {
      const data = await request(ActiveVvmStatusesDocument, { storeId: STORE_ID });
      return [...readFragment(VvmStatusFragment, data.activeVvmStatuses.nodes)];
    },
    get enabled() {
      return enabled();
    },
  }));

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
