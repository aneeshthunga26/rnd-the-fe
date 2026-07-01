import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { NameRowFragment, NamesDocument } from "./operations";

// Bound the option list (Part D): names already server-filter via `codeOrName
// like`, so 50 + typeahead is enough (was 1000).
const NAME_RESULT_CAP = 50;

/**
 * Donor or manufacturer names, searched server-side by code/name. `kind`
 * branches the base filter; the query key keeps distinct prefixes per kind so
 * donor and manufacturer caches don't collide.
 */
export const useNames = (kind: "donor" | "manufacturer", search: Accessor<string>) =>
  useQuery(() => ({
    queryKey: ["names", kind === "donor" ? "donors" : "manufacturers", STORE_ID, search()],
    queryFn: async () => {
      const data = await request(NamesDocument, {
        storeId: STORE_ID,
        first: NAME_RESULT_CAP,
        filter: {
          ...(kind === "donor" ? { isDonor: true } : { isManufacturer: true }),
          isVisible: true,
          ...(search() ? { codeOrName: { like: search() } } : {}),
        },
      });
      return [...readFragment(NameRowFragment, data.names.nodes)];
    },
  }));
