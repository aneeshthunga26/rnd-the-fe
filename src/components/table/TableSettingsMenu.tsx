import { type Component } from "solid-js";
import { Menu, MenuItem, MenuSeparator } from "../ui/Menu";
import { SettingsIcon } from "../icons";
import { useI18n } from "../../intl";
import { toolbarBtnClass } from "./TableToolbar";
import type { Density } from "./DataTable";
import type { PersistedTableState } from "../../lib/persistTableState";

const NEXT_DENSITY: Record<Density, Density> = {
  compact: "comfortable",
  comfortable: "spacious",
  spacious: "compact",
};

const DENSITY_KEY: Record<Density, "status.compact" | "status.comfortable" | "status.spacious"> = {
  compact: "status.compact",
  comfortable: "status.comfortable",
  spacious: "status.spacious",
};

interface Props {
  persisted: PersistedTableState;
  density: () => Density;
  setDensity: (d: Density) => void;
}

/** Gear-button menu: reset order/sizes/pinned, show all, toggle density, reset all. */
export const TableSettingsMenu: Component<Props> = (props) => {
  const { t } = useI18n();
  return (
    <Menu
      trigger={<SettingsIcon />}
      triggerClass={toolbarBtnClass}
      triggerTitle={t("label.table-settings")}
      title={t("label.table-settings")}
      width="15rem"
    >
      <MenuItem onClick={props.persisted.resetOrder}>{t("action.reset-column-order")}</MenuItem>
      <MenuItem onClick={props.persisted.showAll}>{t("action.show-all-columns")}</MenuItem>
      <MenuItem onClick={props.persisted.resetSizes}>{t("action.reset-column-sizes")}</MenuItem>
      <MenuItem onClick={props.persisted.resetPinned}>{t("action.reset-pinned-columns")}</MenuItem>
      <MenuItem onClick={() => props.setDensity(NEXT_DENSITY[props.density()])}>
        <span>{t("label.density")}</span>
        <span class="ms-auto text-xs text-muted">{t(DENSITY_KEY[props.density()])}</span>
      </MenuItem>
      <MenuSeparator />
      <MenuItem tone="danger" onClick={props.persisted.reset}>
        {t("action.reset-table-defaults")}
      </MenuItem>
    </Menu>
  );
};
