import { type Component } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { AsyncCombobox } from "../AsyncCombobox";
import { LocationRowFragment, LocationsDocument, type LocationRow } from "./operations";
import { resolvePick } from "./util";

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
  const query = useQuery(() => ({
    queryKey: ["locations", STORE_ID, props.restrictedToLocationTypeId ?? null],
    queryFn: async () => {
      const data = await request(LocationsDocument, {
        storeId: STORE_ID,
        filter: props.restrictedToLocationTypeId
          ? { locationTypeId: { equalTo: props.restrictedToLocationTypeId } }
          : undefined,
      });
      return [...readFragment(LocationRowFragment, data.locations.nodes)];
    },
  }));

  const rows = () => query.data ?? [];
  const label = (l: LocationRow) =>
    `${l.code} - ${l.name}${l.locationType ? ` (${l.locationType.name})` : ""}`;
  const options = () => rows().map((l) => ({ value: l.id, label: label(l) }));
  const selected = () => (props.value ? { value: props.value.id, label: label(props.value) } : null);

  return (
    <AsyncCombobox
      value={selected()}
      options={options()}
      loading={query.isFetching}
      onChange={(o) => props.onChange(resolvePick(o, rows(), props.value))}
      placeholder="Select location…"
      disabled={props.disabled}
      invalid={props.invalid}
      width={props.width}
    />
  );
};
