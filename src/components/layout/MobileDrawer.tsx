import { type Component, Show } from "solid-js";
import { CloseIcon, Logo } from "../icons";
import { NavContent } from "./NavContent";

/** Full-screen nav drawer for mobile, sliding down from the top. */
export const MobileDrawer: Component<{ open: boolean; onClose: () => void }> = (props) => (
  <Show when={props.open}>
    <div class="drawer-slide-down fixed inset-0 z-50 flex flex-col bg-sidebar">
      <div class="flex items-center justify-between border-b border-line px-4 py-4">
        <Logo class="w-8 h-8" />
        <button type="button" onClick={() => props.onClose()} title="Close" class="text-gray-menu">
          <CloseIcon class="w-6 h-6" />
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto py-2">
        <NavContent onNavigate={props.onClose} />
      </div>
    </div>
  </Show>
);
