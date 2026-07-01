import { type Component, For, Show } from "solid-js";
import { Modal } from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
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
  const ctx = useStocktakeLineError();
  const entries = () =>
    Object.entries(ctx.errors()).filter(([, e]) => e !== undefined) as [string, StocktakeLineError][];

  return (
    <Modal
      open={ctx.isModalOpen()}
      onOpenChange={(o) => !o && ctx.closeModal()}
      title="Stocktake errors"
      width="560px"
      footer={
        <Button variant="primary" onClick={ctx.closeModal}>
          OK
        </Button>
      }
    >
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-gray-muted">
          Some lines could not be saved. Please review and correct the errors below.
        </p>

        <Show when={ctx.stocktakeErrors().length > 0}>
          <div class="flex flex-col gap-2">
            <For each={ctx.stocktakeErrors()}>
              {(msg) => (
                <div class="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">{msg}</div>
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
                    <div class="font-semibold text-[#3a3d44]">{label(error)}</div>
                  </Show>
                  <div class="text-gray-muted">{stocktakeLineErrorMessage(error.__typename)}</div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Modal>
  );
};
