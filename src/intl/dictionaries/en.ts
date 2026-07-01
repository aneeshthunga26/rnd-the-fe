// English — the base dictionary and source of truth for the key type.
//
// Keys are namespaced (app.* label.* action.* message.* status.*) and mirror
// open-mSupply's key style so other locales can be sourced from its locale files.
// The shape here defines the `Dictionary` type; ar.ts / fr.ts are typed against
// it, so a missing key is a compile error.
//
// Template placeholders use `{{ name }}` syntax (resolved by i18n.resolveTemplate).
//
// Seeded with the keys the app needs today (route titles + the stocktakes screen)
// so the later component sweep has keys to wrap strings with.
export const en = {
  app: {
    // App-level / route titles (used by the mobile top bar & breadcrumbs).
    name: "Open mSupply",
    dashboard: "Dashboard",
    replenishment: "Replenishment",
    inventory: "Inventory",
    stock: "Stock",
    locations: "Locations",
    stocktakes: "Stocktakes",
    stocktake: "Stocktake",
    distribution: "Distribution",
    dispensary: "Dispensary",
    reports: "Reports",
    catalogue: "Catalogue",
    settings: "Settings",
    sync: "Sync",
    help: "Help",
  },
  label: {
    // Generic field / column labels.
    number: "Number",
    status: "Status",
    description: "Description",
    comment: "Comment",
    created: "Created",
    language: "Language",
    store: "Store",
    // Stocktake detail fields.
    "stocktake-date": "Stocktake date",
    reason: "Reason",
    location: "Location",
    batch: "Batch",
    expiry: "Expiry",
    "pack-size": "Pack size",
    snapshot: "Snapshot",
    counted: "Counted",
    "doses-counted": "Doses counted",
    "filter-by-status": "Filter by status",
  },
  action: {
    // Buttons / interactive actions.
    "new-stocktake": "New stocktake",
    "export-csv": "Export CSV",
    edit: "Edit",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    close: "Close",
    create: "Create",
    fullscreen: "Fullscreen",
    "exit-fullscreen": "Exit fullscreen",
  },
  status: {
    new: "New",
    finalised: "Finalised",
    "on-hold": "On Hold",
  },
  message: {
    "loading-stocktakes": "Loading stocktakes…",
    "load-stocktakes-failed": "Failed to load stocktakes: {{ error }}",
    "no-stocktakes": "No stocktakes",
    "delete-stocktakes-title": "Delete stocktakes",
    // `count` is a number; the sweep can pair this with format.plural if needed.
    "confirm-delete-stocktakes": "Are you sure? This will delete {{ count }} stocktake(s).",
    "cannot-delete-selected": "Cannot delete finalised or on-hold stocktakes",
    "finalised-not-editable": "This stocktake is finalised and cannot be edited.",
    "on-hold-not-editable": "This stocktake is on hold and cannot be edited.",
    "stocktake-errors": "Stocktake errors",
    "selected-count": "{{ count }} selected",
  },
} as const;

// Widen every leaf from its `as const` string *literal* to `string`, keeping the
// nested key structure. `en` is `as const` so its keys drive the type, but other
// locales supply different strings — so leaves must be `string`, not the English
// literal.
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

// Nested for authoring readability; the provider flattens it into dotted keys
// (e.g. "label.status", "app.stocktakes"). The Dictionary type is the *nested*
// shape — other locales must mirror its keys exactly (a missing key is a
// compile error), with `string` values.
export type Dictionary = Widen<typeof en>;
