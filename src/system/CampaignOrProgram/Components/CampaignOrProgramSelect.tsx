import { type Component } from "solid-js";
import { AsyncCombobox, type ComboboxOption } from "../../../components/inputs/AsyncCombobox";
import { useCampaigns, usePrograms, type CampaignRow, type ProgramRow } from "../api";

interface Props {
  campaignId?: string | null;
  programId?: string | null;
  /** Mutually exclusive: selecting one clears the other. */
  onChange: (value: { campaign: CampaignRow | null; program: ProgramRow | null }) => void;
  /** Restrict programs to those for this item. */
  itemId?: string | null;
  disabled?: boolean;
  width?: string;
}

/**
 * Combined campaign/program picker — the stocktake line assigns one or the other.
 * Options are campaigns + programs in a single list; picking sets one and clears
 * the other.
 */
export const CampaignOrProgramSelect: Component<Props> = (props) => {
  const campaigns = useCampaigns();
  const programs = usePrograms(() => props.itemId);

  const campaignRows = () => campaigns.data ?? [];
  const programRows = () => programs.data ?? [];

  const options = (): ComboboxOption[] => [
    ...campaignRows().map((c) => ({ value: `campaign:${c.id}`, label: c.name, detail: "Campaign" })),
    ...programRows().map((p) => ({ value: `program:${p.id}`, label: p.name, detail: "Program" })),
  ];

  const selected = (): ComboboxOption | null => {
    if (props.campaignId) {
      const c = campaignRows().find((x) => x.id === props.campaignId);
      return { value: `campaign:${props.campaignId}`, label: c?.name ?? "Campaign" };
    }
    if (props.programId) {
      const p = programRows().find((x) => x.id === props.programId);
      return { value: `program:${props.programId}`, label: p?.name ?? "Program" };
    }
    return null;
  };

  const handleChange = (o: ComboboxOption | null) => {
    if (!o) return props.onChange({ campaign: null, program: null });
    const [kind, id] = o.value.split(":");
    if (kind === "campaign") {
      props.onChange({ campaign: campaignRows().find((c) => c.id === id) ?? null, program: null });
    } else {
      props.onChange({ campaign: null, program: programRows().find((p) => p.id === id) ?? null });
    }
  };

  return (
    <AsyncCombobox
      value={selected()}
      options={options()}
      loading={campaigns.isFetching || programs.isFetching}
      onChange={handleChange}
      placeholder="Select campaign or program…"
      disabled={props.disabled}
      width={props.width}
    />
  );
};
