import { graphql, type ResultOf } from "../graphql/graphql";

// ── Preferences ──────────────────────────────────────────────────────────────
export const PreferencesDocument = graphql(`
  query preferences($storeId: String!) {
    preferences(storeId: $storeId) {
      allowTrackingOfStockByDonor
      manageVaccinesInDoses
      manageVvmStatusForStock
      sortByVvmStatusThenExpiry
    }
  }
`);
export type PreferencesResult = ResultOf<typeof PreferencesDocument>["preferences"];
