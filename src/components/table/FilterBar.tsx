import type { JSX, ParentComponent } from "solid-js";
import { ChevronDownIcon } from "../icons";
import { useI18n } from "../../intl";

/**
 * Filter row: an optional `leading` slot (e.g. mobile action icons), the
 * "Filters" menu (pass `menu`; falls back to a static pill), then the active
 * screen-specific filter controls (children).
 */
export const FilterBar: ParentComponent<{ leading?: JSX.Element; menu?: JSX.Element }> = (props) => {
  const { t } = useI18n();
  return (
    <div class="flex items-center gap-3 py-3">
      {props.leading}
      {props.menu ?? (
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg hover:bg-row-hover"
        >
          {t("label.filters")}
          <ChevronDownIcon class="w-4 h-4" />
        </button>
      )}
      {props.children}
    </div>
  );
};
