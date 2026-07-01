import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { Modal } from "../../../../../components/ui/Modal";
import { Button } from "../../../../../components/ui/Button";
import {
  DonorSearchInput,
  getReasonOptionTypes,
  LocationSearchInput,
  ManufacturerSearchInput,
  ReasonOptionsSearchInput,
  StockItemSearchInput,
  usePreferences,
  VVMStatusSearchInput,
} from "../../../../../components/inputs";
import { useStocktakeLineError } from "../../../../../context/stocktakeLineError";
import { stocktakeLineErrorMessage } from "../../../../../context/stocktakeLineError";
import type { StocktakeLine } from "../../api";
import { type DraftItem, type DraftStocktakeLine } from "./draft";
import { useStocktakeLineEdit } from "./useStocktakeLineEdit";

type Tab = "batch" | "pricing" | "other";

// pack-size change: recompute volume + optionally clear a still-default sell price.
const volumePerPackFromVariant = (line: DraftStocktakeLine, packSize: number): number | undefined => {
  const variant = line.itemVariant;
  if (!variant) return undefined;
  const pv = variant.packagingVariants.find((v) => v.packSize === packSize);
  if (!pv) return undefined;
  return ((pv.volumePerUnit ?? 0) / 1000) * (packSize ?? 1);
};

const packSizeChangePatch = (line: DraftStocktakeLine, packSize: number) => {
  const clearSell =
    line.item.defaultPackSize !== packSize &&
    line.item.itemStoreProperties?.defaultSellPricePerPack === line.sellPricePerPack;
  return {
    id: line.id,
    packSize,
    volumePerPack: volumePerPackFromVariant(line, packSize) ?? 0,
    sellPricePerPack: clearSell ? 0 : line.sellPricePerPack,
  };
};

const countedChangePatch = (line: DraftStocktakeLine, counted: number | null) => {
  const keepReason =
    typeof line.countedNumberOfPacks === "number" &&
    counted != null &&
    counted > line.snapshotNumberOfPacks === line.countedNumberOfPacks > line.snapshotNumberOfPacks;
  return { id: line.id, countedNumberOfPacks: counted, reasonOption: keepReason ? line.reasonOption : null };
};

interface Props {
  open: boolean;
  mode: "create" | "update";
  item: DraftItem | null;
  setItem: (item: DraftItem | null) => void;
  disabled: boolean;
  stocktakeId: () => string;
  existingLines: () => StocktakeLine[];
  onClose: () => void;
}

const cellInput =
  "w-full rounded border border-line bg-page px-2 py-1 text-sm disabled:bg-row-hover disabled:text-gray-muted";
const th = "px-2 py-1.5 text-left text-xs font-medium text-gray-muted whitespace-nowrap";
const td = "px-2 py-1 align-middle";

export const StocktakeLineEditModal: Component<Props> = (props) => {
  const prefs = usePreferences();
  const errors = useStocktakeLineError();
  const [tab, setTab] = createSignal<Tab>("batch");

  const controller = useStocktakeLineEdit({
    stocktakeId: props.stocktakeId,
    item: () => props.item,
    existingLines: props.existingLines,
  });

  // Any update clears that line's error first.
  const edit = (patch: Partial<DraftStocktakeLine> & { id: string }) => {
    errors.unsetError(patch.id);
    controller.update(patch);
  };

  // Newest batch (prepended) shown on top → reverse for display.
  const rows = () => [...controller.draftLines].slice().reverse();
  const editable = (line: DraftStocktakeLine) => !props.disabled && line.countThisLine;

  const distinctItems = createMemo(() => {
    const seen = new Set<string>();
    const out: StocktakeLine["item"][] = [];
    for (const l of props.existingLines()) {
      if (!seen.has(l.item.id)) {
        seen.add(l.item.id);
        out.push(l.item);
      }
    }
    return out;
  });
  const excludeIds = () => distinctItems().map((i) => i.id);
  const nextItem = () => {
    const items = distinctItems();
    const idx = items.findIndex((i) => i.id === props.item?.id);
    return idx < 0 || idx >= items.length - 1 ? null : items[idx + 1];
  };

  const isValid = () => controller.draftLines.length > 0 && !controller.isSaving();

  const [banner, setBanner] = createSignal<string[]>([]);

  const doSave = async (): Promise<boolean> => {
    const { errorMessages } = await controller.save();
    if (errorMessages?.length) {
      setBanner(errorMessages);
      return false;
    }
    setBanner([]);
    return true;
  };
  const onOk = async () => {
    if (await doSave()) props.onClose();
  };
  const onNext = async () => {
    if (await doSave()) {
      const next = nextItem();
      if (next) props.setItem(next);
      else props.onClose();
    }
  };

  // ── Cell renderers ──────────────────────────────────────────────────────────
  const countCheckbox = (line: DraftStocktakeLine) => (
    <input
      type="checkbox"
      class="h-4 w-4 accent-brand"
      classList={{ "outline outline-2 outline-red-500": !!errors.getError({ id: line.id }) }}
      checked={line.countThisLine}
      disabled={props.disabled}
      onChange={(e) => edit({ id: line.id, countThisLine: e.currentTarget.checked })}
    />
  );

  const numberCell = (
    line: DraftStocktakeLine,
    value: number | null | undefined,
    onChange: (v: number | null) => void,
    opts?: { disabled?: boolean; error?: boolean; step?: string },
  ) => (
    <input
      type="number"
      class={cellInput}
      classList={{ "border-red-500": opts?.error }}
      value={value ?? ""}
      step={opts?.step}
      disabled={opts?.disabled ?? !editable(line)}
      onChange={(e) => {
        const raw = e.currentTarget.value;
        onChange(raw === "" ? null : Number(raw));
      }}
    />
  );

  const textCell = (
    line: DraftStocktakeLine,
    value: string | null | undefined,
    onChange: (v: string) => void,
  ) => (
    <input
      type="text"
      class={cellInput}
      value={value ?? ""}
      disabled={!editable(line)}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  );

  const dateCell = (
    line: DraftStocktakeLine,
    value: string | null | undefined,
    onChange: (v: string | null) => void,
  ) => (
    <input
      type="date"
      class={cellInput}
      value={value ?? ""}
      disabled={!editable(line)}
      onChange={(e) => onChange(e.currentTarget.value || null)}
    />
  );

  const reasonCell = (line: DraftStocktakeLine) => {
    const counted = line.countedNumberOfPacks;
    const isReduction = line.snapshotNumberOfPacks > (counted ?? 0);
    const disabled =
      props.disabled || typeof counted !== "number" || line.snapshotNumberOfPacks === counted;
    const err = errors.getError({ id: line.id });
    return (
      <ReasonOptionsSearchInput
        value={line.reasonOption ?? null}
        onChange={(reasonOption) => edit({ id: line.id, reasonOption })}
        type={getReasonOptionTypes({ isInventoryReduction: isReduction, isVaccine: line.item.isVaccine })}
        fallbackType={isReduction ? "NEGATIVE_INVENTORY_ADJUSTMENT" : "POSITIVE_INVENTORY_ADJUSTMENT"}
        disabled={disabled}
        invalid={err?.__typename === "AdjustmentReasonNotProvided" || err?.__typename === "AdjustmentReasonNotValid"}
        width="12rem"
      />
    );
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => !o && props.onClose()}
      width="1120px"
      title={props.mode === "create" ? "Add item" : "Edit item"}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Show when={props.mode === "update"}>
            <Button variant="secondary" disabled={!nextItem() || !isValid()} onClick={onNext}>
              OK & Next
            </Button>
          </Show>
          <Button variant="primary" disabled={!isValid()} onClick={onOk}>
            {controller.isSaving() ? "Saving…" : "OK"}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3">
        {/* Header: item */}
        <div class="flex items-end gap-4">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-xs font-medium text-gray-muted">Item</span>
            <Show
              when={props.mode === "create"}
              fallback={<span class="py-2 font-medium">{props.item?.name}</span>}
            >
              <StockItemSearchInput
                value={
                  props.item
                    ? {
                        id: props.item.id,
                        code: props.item.code,
                        name: props.item.name,
                        unitName: props.item.unitName ?? null,
                        isVaccine: props.item.isVaccine,
                        doses: props.item.doses,
                        defaultPackSize: props.item.defaultPackSize,
                        restrictedLocationTypeId: props.item.restrictedLocationTypeId ?? null,
                        itemStoreProperties: props.item.itemStoreProperties ?? null,
                      }
                    : null
                }
                excludeIds={excludeIds()}
                onChange={(i) => props.setItem(i)}
                width="24rem"
              />
            </Show>
          </label>
          <Show when={props.item?.unitName}>
            <div class="pb-2 text-sm text-gray-muted">Unit: {props.item?.unitName}</div>
          </Show>
        </div>

        {/* Error banner */}
        <For each={rows().filter((l) => errors.getError({ id: l.id }))}>
          {(line) => {
            const err = errors.getError({ id: line.id })!;
            return (
              <div class="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700">
                {line.batch ? `${line.batch}: ` : ""}
                {stocktakeLineErrorMessage(err.__typename)}
              </div>
            );
          }}
        </For>
        <Show when={banner().length > 0}>
          <For each={banner()}>
            {(m) => <div class="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700">{m}</div>}
          </For>
        </Show>

        {/* Tabs */}
        <div class="flex items-center gap-1 border-b border-line">
          <For each={[["batch", "Batch"], ["pricing", "Pricing"], ["other", "Other"]] as const}>
            {([key, label]) => (
              <button
                type="button"
                class="border-b-2 px-3 py-1.5 text-sm font-medium"
                classList={{
                  "border-brand text-brand": tab() === key,
                  "border-transparent text-gray-muted hover:text-[#3a3d44]": tab() !== key,
                }}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            )}
          </For>
          <button
            type="button"
            class="ms-auto rounded-full border border-brand px-3 py-1 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-40"
            disabled={props.disabled || !props.item}
            onClick={() => controller.addLine()}
          >
            + Add batch
          </button>
        </div>

        <Show
          when={controller.draftLines.length > 0}
          fallback={<div class="py-8 text-center text-sm text-gray-muted">Add a new line to begin.</div>}
        >
          <div class="max-h-[46vh] overflow-auto">
            {/* BATCH */}
            <Show when={tab() === "batch"}>
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-line">
                    <th class={th}>Count</th>
                    <th class={th}>Batch</th>
                    <th class={th}>Expiry</th>
                    <th class={th}>Manufactured</th>
                    <Show when={prefs().manageVvmStatusForStock && props.item?.isVaccine}>
                      <th class={th}>VVM status</th>
                    </Show>
                    <th class={th}>Pack size</th>
                    <th class={th}>Snapshot</th>
                    <th class={th}>Counted</th>
                    <th class={th}>Volume/pack</th>
                    <th class={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={rows()}>
                    {(line) => (
                      <tr class="border-b border-line" classList={{ "opacity-50": !line.countThisLine }}>
                        <td class={td}>{countCheckbox(line)}</td>
                        <td class={td}>{textCell(line, line.batch, (v) => edit({ id: line.id, batch: v }))}</td>
                        <td class={td}>{dateCell(line, line.expiryDate, (v) => edit({ id: line.id, expiryDate: v }))}</td>
                        <td class={td}>
                          {dateCell(line, line.manufactureDate, (v) => edit({ id: line.id, manufactureDate: v }))}
                        </td>
                        <Show when={prefs().manageVvmStatusForStock && props.item?.isVaccine}>
                          <td class={td}>
                            <VVMStatusSearchInput
                              value={line.vvmStatus ?? null}
                              onChange={(vvmStatus) => edit({ id: line.id, vvmStatus })}
                              disabled={!editable(line)}
                              width="11rem"
                            />
                          </td>
                        </Show>
                        <td class={td}>
                          {numberCell(
                            line,
                            line.packSize ?? line.item.defaultPackSize,
                            (v) => edit(packSizeChangePatch(line, v ?? line.item.defaultPackSize)),
                            { disabled: !editable(line) || !!line.stockLine },
                          )}
                        </td>
                        <td class={`${td} text-right`}>
                          <span
                            classList={{
                              "rounded border border-red-500 px-1":
                                errors.getError({ id: line.id })?.__typename === "SnapshotCountCurrentCountMismatchLine",
                            }}
                          >
                            {line.snapshotNumberOfPacks}
                          </span>
                        </td>
                        <td class={td}>
                          {numberCell(
                            line,
                            line.countedNumberOfPacks,
                            (v) => edit(countedChangePatch(line, v)),
                            { error: errors.getError({ id: line.id })?.__typename === "StockLineReducedBelowZero" },
                          )}
                        </td>
                        <td class={td}>
                          {numberCell(line, line.volumePerPack, (v) => edit({ id: line.id, volumePerPack: v ?? 0 }), {
                            step: "0.0001",
                          })}
                        </td>
                        <td class={td}>{reasonCell(line)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>

            {/* PRICING */}
            <Show when={tab() === "pricing"}>
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-line">
                    <th class={th}>Count</th>
                    <th class={th}>Batch</th>
                    <th class={th}>Sell price</th>
                    <th class={th}>Cost price</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={rows()}>
                    {(line) => (
                      <tr class="border-b border-line" classList={{ "opacity-50": !line.countThisLine }}>
                        <td class={td}>{countCheckbox(line)}</td>
                        <td class={td}>{textCell(line, line.batch, (v) => edit({ id: line.id, batch: v }))}</td>
                        <td class={td}>
                          {numberCell(line, line.sellPricePerPack, (v) => edit({ id: line.id, sellPricePerPack: v }), {
                            step: "0.01",
                          })}
                        </td>
                        <td class={td}>
                          {numberCell(line, line.costPricePerPack, (v) => edit({ id: line.id, costPricePerPack: v }), {
                            step: "0.01",
                          })}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>

            {/* OTHER */}
            <Show when={tab() === "other"}>
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-line">
                    <th class={th}>Count</th>
                    <th class={th}>Batch</th>
                    <th class={th}>Location</th>
                    <Show when={prefs().allowTrackingOfStockByDonor}>
                      <th class={th}>Donor</th>
                    </Show>
                    <th class={th}>Manufacturer</th>
                    <th class={th}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={rows()}>
                    {(line) => (
                      <tr class="border-b border-line" classList={{ "opacity-50": !line.countThisLine }}>
                        <td class={td}>{countCheckbox(line)}</td>
                        <td class={td}>{textCell(line, line.batch, (v) => edit({ id: line.id, batch: v }))}</td>
                        <td class={td}>
                          <LocationSearchInput
                            value={line.location ?? null}
                            restrictedToLocationTypeId={line.item.restrictedLocationTypeId}
                            onChange={(location) => edit({ id: line.id, location })}
                            disabled={!editable(line)}
                            width="12rem"
                          />
                        </td>
                        <Show when={prefs().allowTrackingOfStockByDonor}>
                          <td class={td}>
                            <DonorSearchInput
                              value={line.donorId ? { id: line.donorId, name: line.donorName ?? "", code: "", isOnHold: false } : null}
                              onChange={(d) => edit({ id: line.id, donorId: d?.id ?? null, donorName: d?.name ?? null })}
                              disabled={!editable(line)}
                              width="11rem"
                            />
                          </td>
                        </Show>
                        <td class={td}>
                          <ManufacturerSearchInput
                            value={line.manufacturer ?? null}
                            onChange={(m) =>
                              edit({ id: line.id, manufacturer: m, ...(line.itemVariant ? { itemVariantId: null } : {}) })
                            }
                            disabled={!editable(line)}
                            width="11rem"
                          />
                        </td>
                        <td class={td}>{textCell(line, line.comment, (v) => edit({ id: line.id, comment: v }))}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        </Show>
      </div>
    </Modal>
  );
};
