import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { LocationRowFragment, LocationsDocument } from "./operations";

// Cap results (Part D): locations were previously fetched unbounded. 100 + the
// server-side `name like` filter below (LocationFilterInput.name is a
// StringFilterInput with `like`) keeps the option list bounded via typeahead.
const LOCATION_RESULT_CAP = 100;

/** Locations for this store, optionally restricted to a location type, searched server-side by name. */
export const useLocations = (
  restrictedToLocationTypeId: Accessor<string | null | undefined>,
  search: Accessor<string>,
) =>
  useQuery(() => ({
    queryKey: ["locations", STORE_ID, restrictedToLocationTypeId() ?? null, search()],
    queryFn: async () => {
      const restricted = restrictedToLocationTypeId();
      const term = search();
      const data = await request(LocationsDocument, {
        storeId: STORE_ID,
        first: LOCATION_RESULT_CAP,
        filter:
          restricted || term
            ? {
                ...(restricted ? { locationTypeId: { equalTo: restricted } } : {}),
                ...(term ? { name: { like: term } } : {}),
              }
            : undefined,
      });
      return [...readFragment(LocationRowFragment, data.locations.nodes)];
    },
  }));
