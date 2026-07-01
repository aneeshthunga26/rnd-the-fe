import { type Component, createSignal, For, Show } from "solid-js";
import { SelectionFooter } from "../../../../../components/table/SelectionFooter";
import { ConfirmModal } from "../../../../../components/ui/ConfirmModal";
import { Button } from "../../../../../components/ui/Button";
import { DeleteIcon, LocationIcon, LockIcon, ZeroIcon } from "../../../../../components/icons";
import { useStocktakeLineError } from "../../../../../context/stocktakeLineError";
import type { LocationRow, ReasonOptionRow } from "../../../../../components/inputs";
import {
  type StocktakeDetail,
  type StocktakeLine,
  useSaveStocktakeLines,
  useStocktakeDeleteLines,
  useUpdateStocktake,
} from "../../api";
import { getNextStocktakeStatus } from "../../utils";
import { formatDate } from "../../columns";
import { DraftLine, type DraftStocktakeLine } from "../modal/draft";
import { ChangeLocationModal } from "./ChangeLocationModal";
import { ReduceLinesToZeroModal } from "./ReduceLinesToZeroModal";

interface FooterProps {
  stocktake: StocktakeDetail;
  disabled: boolean;
  selectedRows: StocktakeLine[];
  allLines: StocktakeLine[];
  /** True when finalise should be blocked (no lines / all uncounted) — computed
   *  unfiltered by the parent so an item filter can't wrongly disable it. */
  disableFinalise: boolean;
  resetSelection: () => void;
}

type ConfirmKind = "lock" | "finalise" | "delete" | null;

export const Footer: Component<FooterProps> = (props) => {
  const errors = useStocktakeLineError();
  const stocktakeId = () => props.stocktake.id;
  const update = useUpdateStocktake();
  const { save } = useSaveStocktakeLines(stocktakeId);
  const deleteLines = useStocktakeDeleteLines(stocktakeId);

  const [confirm, setConfirm] = createSignal<ConfirmKind>(null);
  const [changeLocationOpen, setChangeLocationOpen] = createSignal(false);
  const [reduceOpen, setReduceOpen] = createSignal(false);

  const isNew = () => props.stocktake.status === "NEW";
  const nextStatus = () => getNextStocktakeStatus(props.stocktake.status);

  // Build update-bucket drafts from selected rows with overrides.
  const buildDrafts = (overrides: Partial<DraftStocktakeLine>): DraftStocktakeLine[] =>
    props.selectedRows.map((l) => ({
      ...DraftLine.fromStocktakeLine(stocktakeId(), l),
      isUpdated: true,
      countThisLine: true,
      ...overrides,
    }));

  const afterLineSave = (errorMessages?: string[]) => {
    props.resetSelection();
    if (errorMessages?.length) errors.openModal();
  };

  const onChangeLocation = async (location: LocationRow | null) => {
    const { errorMessages } = await save(buildDrafts({ location }));
    afterLineSave(errorMessages);
  };
  const onReduceToZero = async (reason: ReasonOptionRow | null) => {
    const { errorMessages } = await save(buildDrafts({ countedNumberOfPacks: 0, reasonOption: reason }));
    afterLineSave(errorMessages);
  };
  const onDeleteLines = async () => {
    await deleteLines.mutateAsync(props.selectedRows.map((r) => ({ id: r.id })));
    props.resetSelection();
    setConfirm(null);
  };

  const onFinalise = async () => {
    setConfirm(null);
    errors.unsetAll();
    const result = await update.mutateAsync({ id: stocktakeId(), status: "FINALISED" });
    if (result.__typename === "StocktakeNode") return;
    const error = result.error;
    if (error.__typename === "SnapshotCountCurrentCountMismatch") {
      for (const l of error.lines) {
        errors.setError(l.stocktakeLine.id, {
          __typename: "SnapshotCountCurrentCountMismatchLine",
          itemCode: l.stocktakeLine.item.code,
          itemName: l.stocktakeLine.itemName,
          batch: l.stocktakeLine.batch,
        });
      }
    } else if (error.__typename === "StockLinesReducedBelowZero") {
      const byStockLine = new Map(props.allLines.map((l) => [l.stockLine?.id, l.id]));
      for (const e of error.errors) {
        errors.setError(byStockLine.get(e.stockLine.id) ?? e.stockLine.id, {
          __typename: "StockLineReducedBelowZero",
          itemCode: e.stockLine.item.code,
          itemName: e.stockLine.itemName,
          batch: e.stockLine.batch,
        });
      }
    } else {
      errors.setStocktakeErrors([error.description ?? "This stocktake cannot be edited."]);
    }
    errors.openModal();
  };

  const onLock = async () => {
    setConfirm(null);
    await update.mutateAsync({ id: stocktakeId(), isLocked: !props.stocktake.isLocked });
  };

  // ── Selection mode ──────────────────────────────────────────────────────────
  return (
    <>
      <Show when={props.selectedRows.length > 0}>
        <SelectionFooter
          count={props.selectedRows.length}
          onClear={props.resetSelection}
          actions={[
            {
              label: "Delete lines",
              tone: "danger",
              icon: <DeleteIcon class="h-4 w-4" />,
              disabled: props.disabled,
              onClick: () => setConfirm("delete"),
            },
            {
              label: "Change location",
              icon: <LocationIcon class="h-4 w-4" />,
              disabled: props.disabled,
              onClick: () => setChangeLocationOpen(true),
            },
            {
              label: "Reduce to zero",
              icon: <ZeroIcon class="h-4 w-4" />,
              disabled: props.disabled,
              onClick: () => setReduceOpen(true),
            },
          ]}
        />
      </Show>

      {/* No-selection mode: lock + status crumbs + finalise */}
      <Show when={props.selectedRows.length === 0}>
        <div class="flex items-center gap-6 border-t border-line bg-page px-4 py-2.5">
          <Show when={!(props.disabled && !props.stocktake.isLocked)}>
            <button
              type="button"
              disabled={!isNew()}
              onClick={() => setConfirm("lock")}
              class="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
              classList={{
                "border-brand bg-brand-light text-brand": props.stocktake.isLocked,
                "border-line text-gray-menu hover:bg-row-hover": !props.stocktake.isLocked,
              }}
            >
              <LockIcon class="h-4 w-4" /> On hold
            </button>
          </Show>

          <div class="flex items-center gap-3 text-sm text-gray-muted">
            <For
              each={[
                ["New", props.stocktake.createdDatetime] as const,
                ["Finalised", props.stocktake.finalisedDatetime] as const,
              ]}
            >
              {([label, when]) => (
                <div class="flex items-center gap-1">
                  <span classList={{ "font-medium text-[#3a3d44]": !!when }}>{label}</span>
                  <Show when={when}>
                    <span class="text-xs">{formatDate(when)}</span>
                  </Show>
                </div>
              )}
            </For>
          </div>

          <Show when={nextStatus() && !props.disabled}>
            <Button
              class="ms-auto"
              variant="primary"
              disabled={props.disableFinalise || update.isPending}
              title={props.disableFinalise ? "Add and count at least one line before finalising" : undefined}
              onClick={() => setConfirm("finalise")}
            >
              Save and confirm status: Finalised
            </Button>
          </Show>
        </div>
      </Show>

      {/* Confirmations */}
      <ConfirmModal
        open={confirm() === "lock"}
        title="Are you sure?"
        message={
          props.stocktake.isLocked
            ? "This will take the stocktake off hold and allow editing."
            : "This will put the stocktake on hold and prevent editing."
        }
        onConfirm={onLock}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm() === "finalise"}
        title="Are you sure?"
        message="Confirm the stocktake status as Finalised? This cannot be undone."
        confirmLabel="Finalise"
        onConfirm={onFinalise}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm() === "delete"}
        tone="danger"
        title="Delete lines"
        message={`Delete ${props.selectedRows.length} selected line(s)?`}
        confirmLabel="Delete"
        onConfirm={onDeleteLines}
        onCancel={() => setConfirm(null)}
      />

      <ChangeLocationModal
        open={changeLocationOpen()}
        selectedRows={props.selectedRows}
        onConfirm={onChangeLocation}
        onCancel={() => setChangeLocationOpen(false)}
      />
      <ReduceLinesToZeroModal
        open={reduceOpen()}
        selectedRows={props.selectedRows}
        onConfirm={onReduceToZero}
        onCancel={() => setReduceOpen(false)}
      />
    </>
  );
};
