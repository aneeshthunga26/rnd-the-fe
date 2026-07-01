import { type Component, createMemo, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { useQuery } from "@tanstack/solid-query";
import { useNavigate } from "@solidjs/router";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useFormat, useI18n } from "../../../intl";
import { MasterListSearchInput, type MasterListRow } from "../../../system/MasterList";
import { LocationSearchInput, type LocationRow } from "../../../system/Location";
import { VVMStatusSearchInput, type VvmStatusRow } from "../../../system/VvmStatus";
import { usePreferences } from "../../../preferences";
import { useCreateStocktake, useStocktakeApi } from "./api";

type StocktakeType = "BLANK" | "FULL" | "FILTERED";

interface FormState {
  masterList: MasterListRow | null;
  vvmStatus: VvmStatusRow | null;
  location: LocationRow | null;
  expiryDate: string; // YYYY-MM-DD (from <input type="date">)
  type: StocktakeType;
  includeAllItems: boolean;
}

const DEFAULT_STATE: FormState = {
  masterList: null,
  vvmStatus: null,
  location: null,
  expiryDate: "",
  type: "FULL",
  includeAllItems: false,
};

const toNaiveDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional external description forwarded to the new stocktake. */
  description?: string;
}

export const CreateStocktakeModal: Component<Props> = (props) => {
  const { t } = useI18n();
  const fmt = useFormat();
  const navigate = useNavigate();
  const api = useStocktakeApi();
  const prefs = usePreferences();
  const create = useCreateStocktake();
  const [state, setState] = createStore<FormState>({ ...DEFAULT_STATE });

  const setType = (type: StocktakeType) => setState(reconcile({ ...DEFAULT_STATE, type }));

  // "Include all items" (out-of-stock) is only allowed for a pure master-list filter.
  const canIncludeAll = () => !!state.masterList && !state.location && !state.expiryDate && !state.vvmStatus;

  // ── Estimated-lines counts ──────────────────────────────────────────────────
  const countsEnabled = () => props.open && state.type !== "BLANK";

  const stockFilter = createMemo(() => ({
    hasPacksInStore: true,
    ...(state.location ? { location: { id: { equalTo: state.location.id } } } : {}),
    ...(state.masterList ? { masterList: { id: { equalTo: state.masterList.id } } } : {}),
    ...(state.vvmStatus ? { vvmStatusId: { equalTo: state.vvmStatus.id } } : {}),
    ...(state.expiryDate ? { expiryDate: { beforeOrEqualTo: state.expiryDate } } : {}),
  }));

  const itemsFilter = createMemo(() => ({
    isActive: true,
    isVisible: true,
    hasStockOnHand: false,
    type: { equalTo: "STOCK" as const },
    ...(state.masterList ? { masterListId: { equalTo: state.masterList.id } } : {}),
  }));

  const stockCount = useQuery(() => ({
    queryKey: ["stockLinesCount", api.storeId, stockFilter()],
    queryFn: () => api.stockLinesCount(stockFilter()),
    get enabled() {
      return countsEnabled();
    },
  }));

  const noStockCount = useQuery(() => ({
    queryKey: ["itemsCount", api.storeId, itemsFilter()],
    queryFn: () => api.itemsCount(itemsFilter()),
    get enabled() {
      return countsEnabled() && state.includeAllItems;
    },
  }));

  const estimate = () =>
    state.includeAllItems ? (noStockCount.data ?? 0) + (stockCount.data ?? 0) : (stockCount.data ?? 0);

  // ── Comment generation (FILTERED only) ──────────────────────────────────────
  const generateComment = (): string | undefined => {
    if (state.type !== "FILTERED") return "";
    const parts: string[] = [];
    if (state.masterList) parts.push(`in master list ${state.masterList.name}`);
    if (state.location) parts.push(`in location ${state.location.code}`);
    if (state.expiryDate) parts.push(`that expire before ${fmt().formatDate(state.expiryDate)}`);
    if (state.vvmStatus) parts.push(`with VVM status ${state.vvmStatus.description}`);
    if (parts.length === 0) return undefined;
    const filters =
      parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
    return `Created using items ${filters}`;
  };

  const close = () => {
    setState(reconcile({ ...DEFAULT_STATE }));
    props.onOpenChange(false);
  };

  const onSave = async () => {
    const comment = generateComment();
    let args: Record<string, unknown> = {};
    if (state.type === "FULL") {
      args = { isAllItemsStocktake: state.includeAllItems };
    } else if (state.type === "FILTERED") {
      let expiresBefore: string | null = null;
      if (state.expiryDate) {
        const d = new Date(state.expiryDate);
        d.setDate(d.getDate() - 1);
        expiresBefore = toNaiveDate(d);
      }
      args = {
        masterListId: state.masterList?.id,
        locationId: state.location?.id,
        vvmStatusId: state.vvmStatus?.id,
        expiresBefore,
        includeAllMasterListItems: state.includeAllItems,
      };
    } else {
      args = { createBlankStocktake: true };
    }
    const id = await create.mutateAsync({ ...args, description: props.description, comment });
    close();
    if (id) navigate(`/inventory/stocktakes/${id}`);
  };

  const radio = (value: StocktakeType, label: string) => (
    <label class="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input
        type="radio"
        name="stocktake-type"
        class="accent-brand"
        checked={state.type === value}
        onChange={() => setType(value)}
      />
      {label}
    </label>
  );

  // `gated` (FILTERED only): the "all items" option is allowed only for a pure
  // master-list filter. In FULL mode it is always selectable.
  const includeAllSelector = (gated: boolean) => {
    const disableAll = () => gated && !canIncludeAll();
    return (
      <div class="mt-2 flex flex-col gap-1.5 text-sm">
        <label class="flex items-center gap-2">
          <input
            type="radio"
            name="include-all"
            class="accent-brand"
            checked={!state.includeAllItems}
            onChange={() => setState("includeAllItems", false)}
          />
          {t("message.items-with-stock")}
        </label>
        <label class="flex items-center gap-2" classList={{ "opacity-40": disableAll() }}>
          <input
            type="radio"
            name="include-all"
            class="accent-brand"
            disabled={disableAll()}
            checked={state.includeAllItems}
            onChange={() => setState("includeAllItems", true)}
          />
          {t("message.all-items-out-of-stock")}
        </label>
      </div>
    );
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => !o && close()}
      title={t("action.new-stocktake")}
      width="640px"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" disabled={create.isPending} onClick={onSave}>
            {create.isPending ? t("message.saving") : t("action.ok")}
          </Button>
        </>
      }
    >
      <Show
        when={!create.isPending}
        fallback={<div class="py-10 text-center text-muted">{t("message.creating-stocktake")}</div>}
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            {radio("FULL", t("message.create-full-stocktake"))}
            {radio("FILTERED", t("message.create-filtered-stocktake"))}
            {radio("BLANK", t("message.create-blank-stocktake"))}
          </div>

          <div class="rounded-lg border border-line p-4">
            <Show when={state.type === "FULL"}>
              <p class="mb-2 text-sm text-muted">{t("message.full-stocktake-hint")}</p>
              {includeAllSelector(false)}
            </Show>

            <Show when={state.type === "FILTERED"}>
              <p class="mb-3 text-sm text-muted">{t("message.filtered-stocktake-hint")}</p>
              <div class="flex flex-col gap-3">
                <label class="flex flex-col gap-1 text-sm">
                  <span class="text-xs font-medium text-muted">{t("label.master-list")}</span>
                  <MasterListSearchInput
                    value={state.masterList}
                    onChange={(v) => setState({ masterList: v, includeAllItems: false })}
                  />
                </label>
                <Show when={state.masterList}>{includeAllSelector(true)}</Show>

                <label class="flex flex-col gap-1 text-sm">
                  <span class="text-xs font-medium text-muted">{t("label.location")}</span>
                  <LocationSearchInput
                    value={state.location}
                    onChange={(v) => setState({ location: v, includeAllItems: false })}
                  />
                </label>

                <label class="flex flex-col gap-1 text-sm">
                  <span class="text-xs font-medium text-muted">{t("label.items-expiring-before")}</span>
                  <input
                    type="date"
                    class="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
                    value={state.expiryDate}
                    onChange={(e) => setState({ expiryDate: e.currentTarget.value, includeAllItems: false })}
                  />
                </label>

                <Show when={prefs().manageVvmStatusForStock}>
                  <label class="flex flex-col gap-1 text-sm">
                    <span class="text-xs font-medium text-muted">{t("label.vvm-status")}</span>
                    <VVMStatusSearchInput
                      value={state.vvmStatus}
                      onChange={(v) => setState({ vvmStatus: v, includeAllItems: false })}
                    />
                  </label>
                </Show>
              </div>
            </Show>

            <Show when={state.type === "BLANK"}>
              <p class="text-sm text-muted">{t("message.blank-stocktake-hint")}</p>
            </Show>
          </div>

          <Show
            when={state.type !== "BLANK"}
            fallback={
              <div class="rounded-lg border border-success bg-success/10 px-3 py-2 text-sm text-fg">
                {t("message.will-create-blank")}
              </div>
            }
          >
            <div class="rounded-lg border border-brand bg-brand-light px-3 py-2 text-sm text-fg">
              {t("message.lines-estimated", { count: estimate() })}
            </div>
          </Show>
        </div>
      </Show>
    </Modal>
  );
};
