import { type Component, For, Show } from "solid-js";
import { Modal } from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
import { useI18n } from "../../../../intl";
import {
  stocktakeLineErrorMessage,
  type StocktakeLineError,
  useStocktakeLineError,
} from "../../../../context/stocktakeLineError";

const label = (error: StocktakeLineError): string | undefined => {
  if (
    error.__typename !== "StockLineReducedBelowZero" &&
    error.__typename !== "SnapshotCountCurrentCountMismatchLine"
  )
    return undefined;
  const name = error.itemCode ? `${error.itemCode} ${error.itemName ?? ""}` : (error.itemName ?? "");
  return error.batch ? `${name} (${error.batch})` : name;
};

/** Lists stocktake-level + per-line errors from the line-error context. */
export const StocktakeErrorModal: Component = () => {
  const { t } = useI18n();
  const ctx = useStocktakeLineError();
  const entries = () =>
    Object.entries(ctx.errors()).filter(([, e]) => e !== undefined) as [string, StocktakeLineError][];

  return (
    <Modal
      open={ctx.isModalOpen()}
      onOpenChange={(o) => !o && ctx.closeModal()}
      title={t("message.stocktake-errors")}
      width="560px"
      footer={
        <Button variant="primary" onClick={ctx.closeModal}>
          {t("action.ok")}
        </Button>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-muted">{t("message.lines-could-not-be-saved")}</p>

        <Show when={ctx.stocktakeErrors().length > 0}>
          <div class="flex flex-col gap-2">
            <For each={ctx.stocktakeErrors()}>
              {(msg) => (
                <div class="rounded border border-danger bg-danger/10 px-3 py-2 text-danger">{msg}</div>
              )}
            </For>
          </div>
        </Show>

        <Show when={entries().length > 0}>
          <div class="max-h-[50vh] overflow-auto rounded border border-line">
            <For each={entries()}>
              {([, error]) => (
                <div class="border-b border-line px-3 py-2 last:border-b-0">
                  <Show when={label(error)}>
                    <div class="font-semibold text-fg">{label(error)}</div>
                  </Show>
                  <div class="text-muted">{stocktakeLineErrorMessage(error.__typename)}</div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Modal>
  );
};
