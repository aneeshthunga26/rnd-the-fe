import { type Component, createSignal, Show } from "solid-js";
import { Modal } from "../../../../../components/ui/Modal";
import { Button } from "../../../../../components/ui/Button";
import {
  getReasonOptionTypes,
  ReasonOptionsSearchInput,
  type ReasonOptionRow,
} from "../../../../../components/inputs";
import type { StocktakeLine } from "../../api";

interface Props {
  open: boolean;
  selectedRows: StocktakeLine[];
  onConfirm: (reason: ReasonOptionRow | null) => void | Promise<void>;
  onCancel: () => void;
}

/** Reduce the selected lines' counted packs to zero (requires a reason when applicable). */
export const ReduceLinesToZeroModal: Component<Props> = (props) => {
  const [reason, setReason] = createSignal<ReasonOptionRow | null>(null);

  const allVaccines = () => props.selectedRows.length > 0 && props.selectedRows.every((r) => r.item.isVaccine);
  const reasonTypes = () => getReasonOptionTypes({ isInventoryReduction: true, isVaccine: allVaccines() });
  // A reason is required for any inventory reduction (server enforces validity).
  const reasonRequired = () => props.selectedRows.length > 0;

  const confirm = async () => {
    await props.onConfirm(reason());
    setReason(null);
    props.onCancel();
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => !o && props.onCancel()}
      title="Reduce lines to zero"
      width="480px"
      footer={
        <>
          <Button variant="secondary" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={reasonRequired() && !reason()} onClick={confirm}>
            OK
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-gray-muted">
          Are you sure you want to reduce the counted quantity of the selected lines to zero?
        </p>
        <Show when={reasonRequired()}>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-gray-muted">Reason</span>
            <ReasonOptionsSearchInput
              value={reason()}
              onChange={setReason}
              type={reasonTypes()}
              fallbackType="NEGATIVE_INVENTORY_ADJUSTMENT"
            />
          </label>
        </Show>
      </div>
    </Modal>
  );
};
