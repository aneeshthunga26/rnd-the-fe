import { Dialog } from "@kobalte/core/dialog";
import { type Component, type JSX, Show } from "solid-js";
import { CloseIcon } from "../icons";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: JSX.Element;
  children: JSX.Element;
  footer?: JSX.Element;
  /** Max panel width (CSS value). Defaults to 600px. */
  width?: string;
  /** Fixed panel height (CSS value). Defaults to auto (content-sized). */
  height?: string;
}

/**
 * App dialog on Kobalte's accessible `Dialog` (focus trap, Esc, aria). Controlled
 * via `open`/`onOpenChange`; white rounded panel over a dim overlay, matching the
 * app chrome. Used by the create modal, line-edit modal and confirmations.
 */
export const Modal: Component<ModalProps> = (props) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange} modal>
    <Dialog.Portal>
      <Dialog.Overlay class="fixed inset-0 z-50 bg-black/30" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Content
          class="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-line bg-page text-gray-menu shadow-xl"
          style={{ "max-width": props.width ?? "600px", ...(props.height ? { height: props.height } : {}) }}
        >
          <div class="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
            <Dialog.Title class="text-base font-semibold text-[#3a3d44]">{props.title}</Dialog.Title>
            <Dialog.CloseButton
              class="rounded-md p-1 text-gray-muted hover:bg-row-hover"
              aria-label="Close"
            >
              <CloseIcon class="h-5 w-5" />
            </Dialog.CloseButton>
          </div>
          <div class="flex-1 overflow-auto px-5 py-4">{props.children}</div>
          <Show when={props.footer}>
            <div class="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              {props.footer}
            </div>
          </Show>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog>
);
