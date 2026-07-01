import type { Component } from "solid-js";
import { Logo, MenuIcon } from "../icons";

/** Mobile top bar: logo, page title, and a burger that opens the nav drawer. */
export const MobileHeader: Component<{ title: string; onMenu: () => void }> = (props) => (
  <header class="flex h-14 shrink-0 items-center justify-between border-b border-line bg-sidebar px-4">
    <Logo class="w-8 h-8" />
    <h1 class="text-lg font-semibold">{props.title}</h1>
    <button type="button" onClick={() => props.onMenu()} title="Menu" class="text-gray-menu">
      <MenuIcon class="w-6 h-6" />
    </button>
  </header>
);
