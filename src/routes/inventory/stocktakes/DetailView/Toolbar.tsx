import { type Component, createEffect, createSignal, on, Show } from "solid-js";
import { useI18n } from "../../../../intl";
import type { StocktakeDetail, UpdateStocktakePatch } from "../api";

interface ToolbarProps {
  stocktake: StocktakeDetail;
  disabled: boolean;
  onUpdate: (patch: Partial<UpdateStocktakePatch>) => void;
  itemFilter: () => string;
  setItemFilter: (value: string) => void;
}

/** Detail toolbar: editable description, an item search filter, and a status alert. */
export const Toolbar: Component<ToolbarProps> = (props) => {
  const { t } = useI18n();
  const [description, setDescription] = createSignal(props.stocktake.description ?? "");
  // Re-seed only when the stocktake changes (by id), not on every refetch — so an
  // unrelated field commit elsewhere doesn't wipe in-progress typing here.
  createEffect(on(() => props.stocktake.id, () => setDescription(props.stocktake.description ?? "")));

  return (
    <div class="flex flex-col gap-3 py-3">
      <div class="flex flex-wrap items-end gap-4">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-xs font-medium text-muted">{t("label.description")}</span>
          <input
            class="w-72 rounded-lg border border-line bg-bg px-3 py-2 text-sm disabled:bg-row-hover disabled:text-muted"
            value={description()}
            disabled={props.disabled}
            onInput={(e) => setDescription(e.currentTarget.value)}
            onChange={(e) => props.onUpdate({ description: e.currentTarget.value })}
          />
        </label>

        <label class="flex flex-1 flex-col gap-1 text-sm">
          <span class="text-xs font-medium text-muted">{t("label.filter-items")}</span>
          <input
            type="search"
            placeholder={t("message.filter-by-item")}
            class="w-full max-w-md rounded-lg border border-line bg-bg px-3 py-2 text-sm"
            value={props.itemFilter()}
            onInput={(e) => props.setItemFilter(e.currentTarget.value)}
          />
        </label>
      </div>

      <Show when={props.disabled}>
        <div class="rounded-lg border border-line bg-brand-light px-3 py-2 text-sm text-fg">
          {props.stocktake.isLocked
            ? t("message.on-hold-not-editable")
            : t("message.finalised-not-editable")}
        </div>
      </Show>
    </div>
  );
};
