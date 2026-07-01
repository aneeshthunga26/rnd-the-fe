import { type Component, createMemo, createSignal, Show } from "solid-js";
import { Modal } from "../../../../../components/ui/Modal";
import { Button } from "../../../../../components/ui/Button";
import { LocationSearchInput, type LocationRow } from "../../../../../components/inputs";
import { useI18n } from "../../../../../intl";
import type { StocktakeLine } from "../../api";

interface Props {
  open: boolean;
  selectedRows: StocktakeLine[];
  onConfirm: (location: LocationRow | null) => void | Promise<void>;
  onCancel: () => void;
}

/** Change the location of the selected lines (respecting restricted location types). */
export const ChangeLocationModal: Component<Props> = (props) => {
  const { t } = useI18n();
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
      title={t("action.change-location")}
      width="480px"
      footer={
        <>
          <Button variant="secondary" onClick={props.onCancel}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" disabled={hasConflict()} onClick={confirm}>
            {t("action.ok")}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-muted">{t("message.confirm-change-location")}</p>
        <Show when={restrictedTypeIds().length > 0}>
          <div class="rounded border border-line bg-brand-light px-3 py-2 text-fg">
            {hasConflict()
              ? t("message.restricted-location-conflict")
              : t("message.restricted-location-type")}
          </div>
        </Show>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-muted">{t("label.location")}</span>
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
