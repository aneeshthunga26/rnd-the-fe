import { type Component, createMemo, createSignal, Show } from "solid-js";
import { Modal } from "../../../../../components/ui/Modal";
import { Button } from "../../../../../components/ui/Button";
import { LocationSearchInput, type LocationRow } from "../../../../../components/inputs";
import type { StocktakeLine } from "../../api";

interface Props {
  open: boolean;
  selectedRows: StocktakeLine[];
  onConfirm: (location: LocationRow | null) => void | Promise<void>;
  onCancel: () => void;
}

/** Change the location of the selected lines (respecting restricted location types). */
export const ChangeLocationModal: Component<Props> = (props) => {
  const [location, setLocation] = createSignal<LocationRow | null>(null);

  const restrictedTypeIds = createMemo(() => [
    ...new Set(props.selectedRows.map((r) => r.item.restrictedLocationTypeId).filter(Boolean) as string[]),
  ]);
  const hasConflict = () => restrictedTypeIds().length > 1;

  const confirm = async () => {
    await props.onConfirm(location());
    setLocation(null);
    props.onCancel();
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => !o && props.onCancel()}
      title="Change location"
      width="480px"
      footer={
        <>
          <Button variant="secondary" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={hasConflict()} onClick={confirm}>
            OK
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-gray-muted">Are you sure you want to change the location of the selected lines?</p>
        <Show when={restrictedTypeIds().length > 0}>
          <div class="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
            {hasConflict()
              ? "The selected lines have conflicting restricted location types and cannot be moved together."
              : "The selected lines are restricted to a specific location type."}
          </div>
        </Show>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-gray-muted">Location</span>
          <LocationSearchInput
            value={location()}
            restrictedToLocationTypeId={restrictedTypeIds()[0]}
            onChange={setLocation}
            disabled={hasConflict()}
          />
        </label>
      </div>
    </Modal>
  );
};
