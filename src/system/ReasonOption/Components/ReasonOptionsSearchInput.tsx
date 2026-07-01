import { type Component } from "solid-js";
import { AsyncCombobox } from "../../../components/inputs/AsyncCombobox";
import { resolvePick } from "../../../components/inputs/comboboxUtil";
import type { ReasonOptionNodeType } from "../getReasonOptionTypes";
import { useReasonOptions, type ReasonOptionRow } from "../api";

interface Props {
  value: ReasonOptionRow | null;
  onChange: (value: ReasonOptionRow | null) => void;
  /** Which adjustment type(s) to offer (from `getReasonOptionTypes`). */
  type: ReasonOptionNodeType | ReasonOptionNodeType[];
  /** If the primary type has no options, fall back to this type. */
  fallbackType?: ReasonOptionNodeType;
  disabled?: boolean;
  invalid?: boolean;
  width?: string;
}

/** Adjustment-reason picker, filtered client-side by the given reason type(s). */
export const ReasonOptionsSearchInput: Component<Props> = (props) => {
  const query = useReasonOptions();

  const wanted = () => (Array.isArray(props.type) ? props.type : [props.type]);
  const filtered = () => {
    const all = query.data ?? [];
    const primary = all.filter((r) => wanted().includes(r.type as ReasonOptionNodeType));
    if (primary.length === 0 && props.fallbackType) {
      return all.filter((r) => r.type === props.fallbackType);
    }
    return primary;
  };

  const options = () => filtered().map((r) => ({ value: r.id, label: r.reason }));
  const selected = () => (props.value ? { value: props.value.id, label: props.value.reason } : null);

  return (
    <AsyncCombobox
      value={selected()}
      options={options()}
      loading={query.isFetching}
      clearable={false}
      onChange={(o) => props.onChange(resolvePick(o, filtered(), props.value))}
      placeholder="Select reason…"
      disabled={props.disabled}
      invalid={props.invalid}
      width={props.width}
    />
  );
};
