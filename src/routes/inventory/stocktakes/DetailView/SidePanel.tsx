import { type Component, createEffect, createSignal, on, Show } from "solid-js";
import { Button } from "../../../../components/ui/Button";
import { CopyIcon, DeleteIcon } from "../../../../components/icons";
import { useFormat, useI18n } from "../../../../intl";
import type { StocktakeDetail, UpdateStocktakePatch } from "../api";
import { canDeleteStocktake } from "../api";

interface SidePanelProps {
  stocktake: StocktakeDetail;
  disabled: boolean;
  onUpdate: (patch: Partial<UpdateStocktakePatch>) => void;
  onDelete: () => void;
  onCopy: () => void;
}

/** Right-hand editable panel: entered-by/created (read-only) + counted/verified/comment. */
export const SidePanel: Component<SidePanelProps> = (props) => {
  const { t } = useI18n();
  const fmt = useFormat();
  const [countedBy, setCountedBy] = createSignal(props.stocktake.countedBy ?? "");
  const [verifiedBy, setVerifiedBy] = createSignal(props.stocktake.verifiedBy ?? "");
  const [comment, setComment] = createSignal(props.stocktake.comment ?? "");

  // Re-seed only when navigating to a different stocktake — NOT on every refetch,
  // so committing one field doesn't clobber another field's in-progress edit.
  createEffect(
    on(
      () => props.stocktake.id,
      () => {
        setCountedBy(props.stocktake.countedBy ?? "");
        setVerifiedBy(props.stocktake.verifiedBy ?? "");
        setComment(props.stocktake.comment ?? "");
      },
    ),
  );

  const inputClass =
    "rounded-lg border border-line bg-bg px-3 py-2 text-sm disabled:bg-row-hover disabled:text-muted";

  return (
    <aside class="hidden w-72 shrink-0 flex-col gap-4 border-s border-line bg-bg p-4 lg:flex">
      <div class="flex flex-col gap-1 text-sm">
        <span class="text-xs font-medium text-muted">{t("label.entered-by")}</span>
        <span title={props.stocktake.user?.email ?? undefined}>{props.stocktake.user?.username ?? "—"}</span>
      </div>
      <div class="flex flex-col gap-1 text-sm">
        <span class="text-xs font-medium text-muted">{t("label.created")}</span>
        <span>{fmt().formatDate(props.stocktake.createdDatetime)}</span>
      </div>

      <label class="flex flex-col gap-1 text-sm">
        <span class="text-xs font-medium text-muted">{t("label.counted-by")}</span>
        <input
          class={inputClass}
          value={countedBy()}
          disabled={props.disabled}
          onInput={(e) => setCountedBy(e.currentTarget.value)}
          onChange={(e) => props.onUpdate({ countedBy: e.currentTarget.value })}
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="text-xs font-medium text-muted">{t("label.verified-by")}</span>
        <input
          class={inputClass}
          value={verifiedBy()}
          disabled={props.disabled}
          onInput={(e) => setVerifiedBy(e.currentTarget.value)}
          onChange={(e) => props.onUpdate({ verifiedBy: e.currentTarget.value })}
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="text-xs font-medium text-muted">{t("label.comment")}</span>
        <textarea
          rows={4}
          class={inputClass}
          value={comment()}
          disabled={props.disabled}
          onInput={(e) => setComment(e.currentTarget.value)}
          onChange={(e) => props.onUpdate({ comment: e.currentTarget.value })}
        />
      </label>

      <div class="mt-auto flex flex-col gap-2">
        <Show when={canDeleteStocktake(props.stocktake)}>
          <Button variant="danger" onClick={() => props.onDelete()}>
            <DeleteIcon class="h-4 w-4" /> {t("action.delete")}
          </Button>
        </Show>
        <Button variant="secondary" onClick={() => props.onCopy()}>
          <CopyIcon class="h-4 w-4" /> {t("action.copy-to-clipboard")}
        </Button>
      </div>
    </aside>
  );
};
