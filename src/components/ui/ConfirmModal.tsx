import { type Component, type JSX } from "solid-js";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: JSX.Element;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

/** A small yes/no confirmation dialog on top of `Modal`. */
export const ConfirmModal: Component<ConfirmModalProps> = (props) => (
  <Modal
    open={props.open}
    onOpenChange={(open) => !open && props.onCancel()}
    title={props.title}
    width="440px"
    footer={
      <>
        <Button variant="secondary" onClick={() => props.onCancel()}>
          {props.cancelLabel ?? "Cancel"}
        </Button>
        <Button variant={props.tone === "danger" ? "danger" : "primary"} onClick={() => props.onConfirm()}>
          {props.confirmLabel ?? "Confirm"}
        </Button>
      </>
    }
  >
    <div class="text-sm text-fg">{props.message}</div>
  </Modal>
);
