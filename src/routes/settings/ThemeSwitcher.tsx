import { type Component, For, Show } from "solid-js";
import { CheckIcon, DeleteIcon, EditIcon } from "../../components/icons";
import { useI18n } from "../../intl";
import { type CustomTheme, useTheme } from "../../theme";

type BuiltinLabelKey = "label.light" | "label.dark" | "label.system";

/** i18n key for a builtin theme id. */
const builtinLabelKey = (id: string): BuiltinLabelKey =>
  id === "light" ? "label.light" : id === "system" ? "label.system" : "label.dark";

type Swatch = { bg: string; surface: string; brand: string };

/**
 * Fixed swatch colours for the builtin previews (mirrors the token defaults in
 * index.css). These are literal preview colours by design — a swatch must show a
 * theme's colours regardless of the currently-active theme, and "system" blends
 * light/dark — so they intentionally aren't semantic tokens (which follow the
 * active theme).
 */
const builtinSwatch = (id: string): Swatch => {
  if (id === "light") return { bg: "rgb(255 255 255)", surface: "rgb(244 245 247)", brand: "rgb(232 92 46)" };
  if (id === "system") return { bg: "rgb(255 255 255)", surface: "rgb(31 34 41)", brand: "rgb(232 92 46)" };
  return { bg: "rgb(22 24 29)", surface: "rgb(31 34 41)", brand: "rgb(232 92 46)" };
};

const customSwatch = (theme: CustomTheme): Swatch => ({
  bg: theme.vars["--color-bg"] ?? "rgb(255 255 255)",
  surface: theme.vars["--color-surface"] ?? "rgb(244 245 247)",
  brand: theme.vars["--color-brand"] ?? "rgb(232 92 46)",
});

const Swatch: Component<{ colors: Swatch }> = (props) => (
  <div class="flex h-8 w-12 shrink-0 overflow-hidden rounded-md border border-line" aria-hidden="true">
    <div class="flex-1" style={{ "background-color": props.colors.bg }} />
    <div class="flex-1" style={{ "background-color": props.colors.surface }} />
    <div class="flex-1" style={{ "background-color": props.colors.brand }} />
  </div>
);

interface ThemeSwitcherProps {
  /** Open the editor to edit an existing custom theme. */
  onEdit: (theme: CustomTheme) => void;
}

/**
 * Lists the built-in themes (Light / Dark / System) plus each custom theme as a
 * selectable card with a small swatch preview. Selecting a card applies the
 * theme live via `setTheme`. Custom themes carry Edit / Delete actions.
 */
export const ThemeSwitcher: Component<ThemeSwitcherProps> = (props) => {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <For each={["light", "dark", "system"]}>
        {(id) => (
          <button
            type="button"
            onClick={() => theme.setTheme(id)}
            class="flex items-center gap-3 rounded-lg border p-3 text-start transition-colors hover:bg-row-hover"
            classList={{
              "border-brand ring-1 ring-brand": theme.themeId() === id,
              "border-line": theme.themeId() !== id,
            }}
          >
            <Swatch colors={builtinSwatch(id)} />
            <span class="flex-1 text-sm font-medium text-fg">{t(builtinLabelKey(id))}</span>
            <Show when={theme.themeId() === id}>
              <CheckIcon class="h-5 w-5 text-brand" />
            </Show>
          </button>
        )}
      </For>

      <For each={theme.customThemes()}>
        {(custom) => (
          <div
            class="flex items-center gap-3 rounded-lg border p-3 transition-colors"
            classList={{
              "border-brand ring-1 ring-brand": theme.themeId() === custom.id,
              "border-line": theme.themeId() !== custom.id,
            }}
          >
            <button
              type="button"
              onClick={() => theme.setTheme(custom.id)}
              class="flex flex-1 items-center gap-3 text-start"
            >
              <Swatch colors={customSwatch(custom)} />
              <span class="flex-1 truncate text-sm font-medium text-fg">{custom.name}</span>
              <Show when={theme.themeId() === custom.id}>
                <CheckIcon class="h-5 w-5 text-brand" />
              </Show>
            </button>
            <button
              type="button"
              title={t("action.edit-theme")}
              aria-label={t("action.edit-theme")}
              onClick={() => props.onEdit(custom)}
              class="rounded-md p-1 text-muted hover:bg-row-hover"
            >
              <EditIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              title={t("action.delete-theme")}
              aria-label={t("action.delete-theme")}
              onClick={() => theme.deleteCustomTheme(custom.id)}
              class="rounded-md p-1 text-danger hover:bg-row-hover"
            >
              <DeleteIcon class="h-4 w-4" />
            </button>
          </div>
        )}
      </For>
    </div>
  );
};
