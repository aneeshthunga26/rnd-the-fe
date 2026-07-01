import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { ItemStockOnHandFragment, ItemsDocument } from "./operations";

/** Visible/on-hand STOCK items, searched server-side by code/name (capped at 100). */
export const useStockItems = (search: Accessor<string>, excludeIds: Accessor<string[] | undefined>) =>
  useQuery(() => ({
    queryKey: ["items", STORE_ID, search(), (excludeIds() ?? []).join(",")],
    queryFn: async () => {
      const data = await request(ItemsDocument, {
        storeId: STORE_ID,
        first: 100,
        filter: {
          type: { equalTo: "STOCK" },
          isActive: true,
          isVisibleOrOnHand: true,
          ...(search() ? { codeOrName: { like: search() } } : {}),
          ...(excludeIds()?.length ? { id: { notEqualAll: excludeIds() } } : {}),
        },
      });
      return [...readFragment(ItemStockOnHandFragment, data.items.nodes)];
    },
  }));
