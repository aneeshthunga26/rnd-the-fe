import {
  type Accessor,
  createContext,
  createRenderEffect,
  createSignal,
  type JSX,
  onCleanup,
  type ParentComponent,
  useContext,
} from "solid-js";

// The layout owns the AppBar; screens contribute their action buttons into it
// via <PageActions>. This keeps screens as pure content — they declare *what*
// belongs in the header without rendering the header themselves.

type PageHeaderCtx = {
  actions: Accessor<JSX.Element>;
  setActions: (value: () => JSX.Element) => void;
};

const Context = createContext<PageHeaderCtx>();

export const PageHeaderProvider: ParentComponent = (props) => {
  const [actions, setActions] = createSignal<JSX.Element>(null);
  return <Context.Provider value={{ actions, setActions }}>{props.children}</Context.Provider>;
};

function usePageHeader() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("PageHeader components must be used inside AppLayout");
  return ctx;
}

/** Read the current screen's header actions (used by the layout's AppBar). */
export const useHeaderActions = () => usePageHeader().actions;

/**
 * Teleports its children into the layout's AppBar action slot for as long as
 * the screen is mounted. Renders nothing in place.
 */
export const PageActions: ParentComponent = (props) => {
  const { setActions } = usePageHeader();
  createRenderEffect(() => setActions(() => props.children));
  onCleanup(() => setActions(() => null));
  return null;
};
