import { type Component, createSignal, Show } from "solid-js";
import { Modal } from "../../../../../components/ui/Modal";
import { Button } from "../../../../../components/ui/Button";
import {
  getReasonOptionTypes,
  ReasonOptionsSearchInput,
  type ReasonOptionRow,
} from "../../../../../system/ReasonOption";
import { useI18n } from "../../../../../intl";
import type { StocktakeLine } from "../../api";

interface Props {
  open: boolean;
  selectedRows: StocktakeLine[];
  onConfirm: (reason: ReasonOptionRow | null) => void | Promise<void>;
  onCancel: () => void;
}

/** Reduce the selected lines' counted packs to zero (requires a reason when applicable). */
export const ReduceLinesToZeroModal: Component<Props> = (props) => {
  const { t } = useI18n();
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
      title={t("action.reduce-lines-to-zero")}
      width="480px"
      footer={
        <>
          <Button variant="secondary" onClick={props.onCancel}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" disabled={reasonRequired() && !reason()} onClick={confirm}>
            {t("action.ok")}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-muted">{t("message.confirm-reduce-to-zero")}</p>
        <Show when={reasonRequired()}>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted">{t("label.reason")}</span>
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
