import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { STORE_ID } from "../../../graphql/config";
import { CampaignRowFragment, CampaignsDocument } from "./operations";

/** Campaigns for this store. */
export const useCampaigns = () =>
  useQuery(() => ({
    queryKey: ["campaigns", STORE_ID],
    queryFn: async () => {
      const data = await request(CampaignsDocument, { storeId: STORE_ID });
      return [...readFragment(CampaignRowFragment, data.campaigns.nodes)];
    },
  }));
