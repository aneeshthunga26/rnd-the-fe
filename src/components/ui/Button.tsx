import { type Component, type JSX, splitProps } from "solid-js";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 border border-brand",
  secondary: "border border-line text-gray-menu hover:bg-row-hover",
  danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
  ghost: "text-gray-menu hover:bg-row-hover",
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
