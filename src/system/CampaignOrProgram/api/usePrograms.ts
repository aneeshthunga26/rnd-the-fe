import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { ProgramRowFragment, ProgramsDocument } from "./operations";

/** Programs that exist for this store, optionally restricted to an item. */
export const usePrograms = (itemId: Accessor<string | null | undefined>) =>
  useQuery(() => ({
    queryKey: ["programs", STORE_ID, itemId() ?? null],
    queryFn: async () => {
      const data = await request(ProgramsDocument, {
        storeId: STORE_ID,
        filter: {
          existsForStoreId: { equalTo: STORE_ID },
          ...(itemId() ? { itemId: { equalTo: itemId() } } : {}),
        },
      });
      return [...readFragment(ProgramRowFragment, data.programs.nodes)];
    },
  }));
