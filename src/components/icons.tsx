import type { Component, JSX } from "solid-js";

type IconProps = { class?: string };

const Svg: Component<IconProps & { children: JSX.Element }> = (props) => (
  <svg
    class={props.class ?? "w-5 h-5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {props.children}
  </svg>
);

// Brand logo — simple placeholder mark (orange rounded square + package glyph).
export const Logo: Component<IconProps> = (props) => (
  <svg class={props.class ?? "w-9 h-9"} viewBox="0 0 40 40" aria-hidden="true">
    <rect x="2" y="2" width="36" height="36" rx="9" fill="var(--color-brand)" />
    <path
      d="M20 10l8 4.5v9L20 28l-8-4.5v-9L20 10z"
      fill="none"
      stroke="#fff"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M12 14.5l8 4.5 8-4.5M20 19v9" stroke="#fff" stroke-width="2" stroke-linejoin="round" />
  </svg>
);

export const DashboardIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
  </Svg>
);

export const ReplenishmentIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 0114-5.3L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 01-14 5.3L4 16" />
    <path d="M4 20v-4h4" />
  </Svg>
);

export const InventoryIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Svg>
);

export const DistributionIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Svg>
);

export const DispensaryIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 11a3 3 0 000-6M21 20c0-2.5-1.5-4.6-3.6-5.5" />
  </Svg>
);

export const ReportsIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const CatalogueIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </Svg>
);

export const SettingsIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 00-.1-1.3l2-1.6-2-3.4-2.4 1a7 7 0 00-2.3-1.3L13.8 2h-3.6l-.4 2.4a7 7 0 00-2.3 1.3l-2.4-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.3l-2 1.6 2 3.4 2.4-1a7 7 0 002.3 1.3l.4 2.4h3.6l.4-2.4a7 7 0 002.3-1.3l2.4 1 2-3.4-2-1.6A7 7 0 0019 12z" />
  </Svg>
);

export const SyncIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 12a7 7 0 017-7M19 12a7 7 0 01-7 7" />
    <path d="M12 5l-2.5 2M12 19l2.5-2" />
    <circle cx="12" cy="12" r="1.5" />
  </Svg>
);

export const HelpIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 013.5-2.3c1 .4 1.5 1.3 1.5 2.3 0 1.7-2.5 2-2.5 3.5" />
    <path d="M12 17h.01" />
  </Svg>
);

export const ChevronRightIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const ChevronLeftIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const ChevronDownIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const ChevronsLeftIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M17 6l-6 6 6 6M11 6l-6 6 6 6" />
  </Svg>
);

export const ChevronsRightIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M7 6l6 6-6 6M13 6l6 6-6 6" />
  </Svg>
);

export const PlusCircleIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const UploadIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4" />
  </Svg>
);

export const ColumnsIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M9 4v16M15 4v16" />
  </Svg>
);

export const FullscreenIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);

export const CommentIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" />
  </Svg>
);

export const StoreIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 9l1-4h14l1 4M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16" />
  </Svg>
);

export const EditIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L18 10l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
);

export const CheckIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
);

export const LanguageIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 5h9M8 3v2c0 4-2 7-5 8M6 8c0 3 3 5 6 6" />
    <path d="M13 21l4-9 4 9M14.5 17h5" />
  </Svg>
);

export const MenuIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const UserIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </Svg>
);

export const CloseIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const DeleteIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const LockIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </Svg>
);

export const CopyIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </Svg>
);

export const LocationIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </Svg>
);

export const ZeroIcon: Component<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M7 7l10 10" />
  </Svg>
);
