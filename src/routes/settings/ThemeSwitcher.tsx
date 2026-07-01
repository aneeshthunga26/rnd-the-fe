import { type Component, For, Show } from "solid-js";
import { CheckIcon, DeleteIcon, EditIcon } from "../../components/icons";
import { type CustomTheme, useTheme } from "../../theme";

/** Human labels for the builtin theme ids. */
const BUILTIN_LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** Fixed swatch colours for the builtin previews (matches index.css). */
const BUILTIN_SWATCHES: Record<string, { bg: string; surface: string; brand: string }> = {
  light: { bg: "#ffffff", surface: "#f4f5f7", brand: "#e85c2e" },
  dark: { bg: "#16181d", surface: "#1f2229", brand: "#e85c2e" },
  system: { bg: "#ffffff", surface: "#1f2229", brand: "#e85c2e" },
};

const customSwatch = (theme: CustomTheme) => ({
  bg: theme.vars["--color-bg"] ?? "#ffffff",
  surface: theme.vars["--color-surface"] ?? "#f4f5f7",
  brand: theme.vars["--color-brand"] ?? "#e85c2e",
});

const Swatch: Component<{ colors: { bg: string; surface: string; brand: string } }> = (props) => (
  <div
    class="flex h-8 w-12 shrink-0 overflow-hidden rounded-md border border-line"
    aria-hidden="true"
  >
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
            <Swatch colors={BUILTIN_SWATCHES[id]} />
            <span class="flex-1 text-sm font-medium text-fg">{BUILTIN_LABELS[id]}</span>
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
              title="Edit theme"
              aria-label="Edit theme"
              onClick={() => props.onEdit(custom)}
              class="rounded-md p-1 text-muted hover:bg-row-hover"
            >
              <EditIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Delete theme"
              aria-label="Delete theme"
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
