import { type Component, type JSX, splitProps } from "solid-js";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover border border-brand",
  secondary: "border border-line text-fg hover:bg-row-hover",
  danger: "bg-danger text-on-brand hover:bg-danger/90 border border-danger",
  ghost: "text-fg hover:bg-row-hover",
};

/** Shared button matching the app's pill style, with a few tones. */
export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);
  return (
    <button
      type="button"
      {...rest}
      class={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        VARIANTS[local.variant ?? "secondary"]
      } ${local.class ?? ""}`}
    >
      {local.children}
    </button>
  );
};
