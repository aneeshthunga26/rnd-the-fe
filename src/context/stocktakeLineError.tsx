import { type Accessor, createContext, createSignal, type ParentComponent, useContext } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

/** Known line-level error `__typename`s (batch-line + unwrapped document errors). */
export type StocktakeLineErrorType =
  | "StockLineReducedBelowZero"
  | "SnapshotCountCurrentCountMismatchLine"
  | "AdjustmentReasonNotProvided"
  | "AdjustmentReasonNotValid"
  | "CannotEditStocktake";

export interface StocktakeLineError {
  __typename: StocktakeLineErrorType | string;
  description?: string;
  /** Optional identity for the error modal label. */
  itemCode?: string | null;
  itemName?: string | null;
  batch?: string | null;
}

/** Maps an error `__typename` to a human message (i18n stand-in for this port). */
export const stocktakeLineErrorMessage = (typename: string): string => {
  switch (typename) {
    case "StockLineReducedBelowZero":
      return "Reducing the count would take stock below zero.";
    case "SnapshotCountCurrentCountMismatchLine":
      return "The stock on hand has changed since the snapshot was taken.";
    case "AdjustmentReasonNotProvided":
      return "Please provide a reason for the adjustment.";
    case "AdjustmentReasonNotValid":
      return "Please provide a valid reason for the adjustment.";
    case "CannotEditStocktake":
      return "This stocktake can no longer be edited.";
    default:
      return "An unexpected error occurred.";
  }
};

interface StocktakeLineErrorContextValue {
  errors: Accessor<Record<string, StocktakeLineError | undefined>>;
  getError: (line: { id: string }) => StocktakeLineError | undefined;
  setError: (id: string, error: StocktakeLineError) => void;
  unsetError: (id: string) => void;
  unsetAll: () => void;
  stocktakeErrors: Accessor<string[]>;
  setStocktakeErrors: (messages: string[]) => void;
  isModalOpen: Accessor<boolean>;
  openModal: () => void;
  closeModal: () => void;
}

const Context = createContext<StocktakeLineErrorContextValue>();

/** Holds per-line errors + stocktake-level messages + the error-modal open flag. */
export const StocktakeLineErrorProvider: ParentComponent = (props) => {
  const [errors, setErrors] = createStore<Record<string, StocktakeLineError | undefined>>({});
  const [stocktakeErrors, setStocktakeErrors] = createSignal<string[]>([]);
  const [isModalOpen, setModalOpen] = createSignal(false);

  const value: StocktakeLineErrorContextValue = {
    errors: () => errors,
    getError: (line) => errors[line.id],
    setError: (id, error) => setErrors(id, error),
    unsetError: (id) => setErrors(id, undefined),
    unsetAll: () => {
      setErrors(reconcile({}));
      setStocktakeErrors([]);
    },
    stocktakeErrors,
    setStocktakeErrors,
    isModalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
  };

  return <Context.Provider value={value}>{props.children}</Context.Provider>;
};

/** Access the line-error context; throws if used outside the provider. */
export const useStocktakeLineError = (): StocktakeLineErrorContextValue => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useStocktakeLineError must be used within StocktakeLineErrorProvider");
  return ctx;
};
