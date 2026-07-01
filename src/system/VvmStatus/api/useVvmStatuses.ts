import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { ActiveVvmStatusesDocument, VvmStatusFragment } from "./operations";

/** Active VVM statuses for this store. Gated by `enabled` (a preference gate). */
export const useActiveVvmStatuses = (enabled: Accessor<boolean>) =>
  useQuery(() => ({
    queryKey: ["vvmStatuses", STORE_ID],
    queryFn: async () => {
      const data = await request(ActiveVvmStatusesDocument, { storeId: STORE_ID });
      return [...readFragment(VvmStatusFragment, data.activeVvmStatuses.nodes)];
    },
    get enabled() {
      return enabled();
    },
  }));
