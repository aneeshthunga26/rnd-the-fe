import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { MasterListRowFragment, MasterListsDocument } from "./operations";

/** Master lists that exist for this store, searched server-side by name. */
export const useMasterLists = (search: Accessor<string>) =>
  useQuery(() => ({
    queryKey: ["masterLists", STORE_ID, search()],
    queryFn: async () => {
      const data = await request(MasterListsDocument, {
        storeId: STORE_ID,
        filter: {
          existsForStoreId: { equalTo: STORE_ID },
          ...(search() ? { name: { like: search() } } : {}),
        },
      });
      return [...readFragment(MasterListRowFragment, data.masterLists.nodes)];
    },
  }));
