import { type Component } from "solid-js";
import { Menu, MenuItem, MenuSeparator } from "../ui/Menu";
import { SettingsIcon } from "../icons";
import { toolbarBtnClass } from "./TableToolbar";
import type { Density } from "./DataTable";
import type { PersistedTableState } from "../../lib/persistTableState";

const NEXT_DENSITY: Record<Density, Density> = {
  compact: "comfortable",
  comfortable: "spacious",
  spacious: "compact",
};

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Compact",
  comfortable: "Comfortable",
  spacious: "Spacious",
};

interface Props {
  persisted: PersistedTableState;
  density: () => Density;
  setDensity: (d: Density) => void;
}

/** Gear-button menu: reset order/sizes/pinned, show all, toggle density, reset all. */
export const TableSettingsMenu: Component<Props> = (props) => (
  <Menu
    trigger={<SettingsIcon />}
    triggerClass={toolbarBtnClass}
    triggerTitle="Table settings"
    title="Table settings"
    width="15rem"
  >
    <MenuItem onClick={props.persisted.resetOrder}>Reset column order</MenuItem>
    <MenuItem onClick={props.persisted.showAll}>Show all columns</MenuItem>
    <MenuItem onClick={props.persisted.resetSizes}>Reset column sizes</MenuItem>
    <MenuItem onClick={props.persisted.resetPinned}>Reset pinned columns</MenuItem>
    <MenuItem onClick={() => props.setDensity(NEXT_DENSITY[props.density()])}>
      <span>Density</span>
      <span class="ms-auto text-xs text-gray-muted">{DENSITY_LABEL[props.density()]}</span>
    </MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onClick={props.persisted.reset}>
      Reset table to defaults
    </MenuItem>
  </Menu>
);
