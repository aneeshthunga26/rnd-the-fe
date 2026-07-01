import { type Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { request } from "../graphql/client";
import { STORE_ID } from "../graphql/config";
import { PreferencesDocument, type PreferencesResult } from "./operations";

/**
 * Store preferences relevant to the stocktake screens. Returns an accessor to a
 * partial prefs object (empty until the query resolves), mirroring open-mSupply's
 * `usePreferences`. Consumers gate fields on e.g. `prefs().manageVvmStatusForStock`.
 */
export const usePreferences = (): Accessor<Partial<PreferencesResult>> => {
  const query = useQuery(() => ({
    queryKey: ["preferences", STORE_ID],
    queryFn: async () => (await request(PreferencesDocument, { storeId: STORE_ID })).preferences,
    staleTime: Infinity,
    gcTime: Infinity,
  }));
  return () => query.data ?? {};
};
