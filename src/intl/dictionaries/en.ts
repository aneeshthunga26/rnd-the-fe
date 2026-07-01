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
    filters: "Filters",
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
    // Additional column / field labels.
    code: "Code",
    name: "Name",
    manufactured: "Manufactured",
    unit: "Unit",
    "doses-per-unit": "Doses per unit",
    difference: "Difference",
    donor: "Donor",
    manufacturer: "Manufacturer",
    item: "Item",
    count: "Count",
    "vvm-status": "VVM status",
    "volume-per-pack": "Volume/pack",
    "sell-price": "Sell price",
    "cost-price": "Cost price",
    "master-list": "Master list",
    "entered-by": "Entered by",
    "counted-by": "Counted by",
    "verified-by": "Verified by",
    "filter-items": "Filter items",
    "items-expiring-before": "Items expiring before",
    pricing: "Pricing",
    other: "Other",
    // Settings.
    appearance: "Appearance",
    "keyboard-shortcuts": "Keyboard shortcuts",
    // Pagination / table.
    "rows-per-page": "Rows per page",
    columns: "Columns",
    "table-settings": "Table settings",
    density: "Density",
    "select-column": "Select",
    // Themes.
    light: "Light",
    dark: "Dark",
    system: "System",
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
    ok: "OK",
    "ok-and-next": "OK & Next",
    fullscreen: "Fullscreen",
    "exit-fullscreen": "Exit fullscreen",
    menu: "Menu",
    "collapse-sidebar": "Collapse sidebar",
    "expand-sidebar": "Expand sidebar",
    // Column picker / table settings.
    "hide-all": "Hide all",
    "show-all": "Show all",
    "reset-order": "Reset order",
    "unpin-all": "Unpin all",
    "reset-column-order": "Reset column order",
    "show-all-columns": "Show all columns",
    "reset-column-sizes": "Reset column sizes",
    "reset-pinned-columns": "Reset pinned columns",
    "reset-table-defaults": "Reset table to defaults",
    "pin-left": "Pin left",
    "pin-right": "Pin right",
    "move-up": "Move up",
    "move-down": "Move down",
    // Detail actions.
    "add-item": "Add item",
    "edit-item": "Edit item",
    "add-batch": "Add batch",
    "delete-lines": "Delete lines",
    "change-location": "Change location",
    "reduce-to-zero": "Reduce to zero",
    "reduce-lines-to-zero": "Reduce lines to zero",
    "on-hold": "On hold",
    "copy-to-clipboard": "Copy to clipboard",
    finalise: "Finalise",
    "return-to-stocktakes": "Return to stocktakes",
    "clear-selection": "Clear selection",
    "remove-all-filters": "Remove all filters",
    // Themes.
    "create-theme": "Create theme",
    "edit-theme": "Edit theme",
    "delete-theme": "Delete theme",
    "save-theme": "Save theme",
    reset: "Reset",
  },
  status: {
    new: "New",
    finalised: "Finalised",
    "on-hold": "On Hold",
    compact: "Compact",
    comfortable: "Comfortable",
    spacious: "Spacious",
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
    // Placeholder screens.
    "coming-soon": "{{ title }} — coming soon",
    // Pagination.
    "showing-range": "Showing {{ start }}–{{ end }} of {{ total }}",
    // Create-stocktake modal.
    "loading-stocktake": "Loading stocktake…",
    "creating-stocktake": "Creating stocktake…",
    saving: "Saving…",
    "stocktake-not-found": "Stocktake not found.",
    "create-full-stocktake": "Create a full stocktake",
    "create-filtered-stocktake": "Create a filtered stocktake",
    "create-blank-stocktake": "Create blank stocktake",
    "full-stocktake-hint": "Creating a stocktake for all items in your store.",
    "filtered-stocktake-hint": "Select filters below to control which items are included in the stocktake.",
    "blank-stocktake-hint": "You can add items manually after creating the stocktake.",
    "items-with-stock": "Items with stock on hand",
    "all-items-out-of-stock": "All items (include out of stock items)",
    "will-create-blank": "This will create a blank stocktake.",
    "lines-estimated": "{{ count }} lines estimated",
    // Detail toolbar / footer.
    "filter-by-item": "Filter by item code or name…",
    "confirm-finalise-title": "Are you sure?",
    "confirm-finalise": "Confirm the stocktake status as Finalised? This cannot be undone.",
    "confirm-lock": "This will put the stocktake on hold and prevent editing.",
    "confirm-unlock": "This will take the stocktake off hold and allow editing.",
    "save-and-confirm-finalised": "Save and confirm status: Finalised",
    "finalise-needs-lines": "Add and count at least one line before finalising",
    "confirm-delete-lines": "Delete {{ count }} selected line(s)?",
    "confirm-change-location": "Are you sure you want to change the location of the selected lines?",
    "restricted-location-conflict":
      "The selected lines have conflicting restricted location types and cannot be moved together.",
    "restricted-location-type": "The selected lines are restricted to a specific location type.",
    "confirm-reduce-to-zero":
      "Are you sure you want to reduce the counted quantity of the selected lines to zero?",
    "cannot-edit-stocktake": "This stocktake cannot be edited.",
    "lines-could-not-be-saved": "Some lines could not be saved. Please review and correct the errors below.",
    "add-line-to-begin": "Add a new line to begin.",
    // Theme editor.
    "contrast-ratio": "Text / background contrast: {{ ratio }}:1",
    "passes-wcag-aa": "(passes WCAG AA)",
    "below-wcag-aa": "(below WCAG AA — 4.5:1)",
    // Shortcuts.
    "shortcut-conflict": "Conflicts with another shortcut",
    "press-keys": "Press keys...",
    "rebind-shortcut": "Rebind {{ label }}",
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
