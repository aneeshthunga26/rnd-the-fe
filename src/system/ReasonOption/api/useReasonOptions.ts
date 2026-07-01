import { useQuery } from "@tanstack/solid-query";
import { readFragment } from "../../../graphql/graphql";
import { request } from "../../../graphql/client";
import { ReasonOptionRowFragment, ReasonOptionsDocument } from "./operations";

/** All active reason options. The component filters client-side by reason type. */
export const useReasonOptions = () =>
  useQuery(() => ({
    queryKey: ["reasonOptions"],
    queryFn: async () => {
      const data = await request(ReasonOptionsDocument, { filter: { isActive: true } });
      return [...readFragment(ReasonOptionRowFragment, data.reasonOptions.nodes)];
    },
  }));
