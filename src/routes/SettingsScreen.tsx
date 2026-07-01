import { type Component, createSignal, type JSX } from "solid-js";
import { PlusCircleIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import type { CustomTheme } from "../theme";
import { ThemeEditor } from "./settings/ThemeEditor";
import { ThemeSwitcher } from "./settings/ThemeSwitcher";

/**
 * A settings section: a titled, bordered card. New sections (e.g. the future
 * ShortcutsSettings) drop into the stacked layout below with no other changes.
 */
const Section: Component<{
  title: string;
  description?: string;
  actions?: JSX.Element;
  children: JSX.Element;
}> = (props) => (
  <section class="rounded-xl border border-line bg-surface p-5">
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-fg">{props.title}</h2>
        {props.description && <p class="mt-0.5 text-sm text-muted">{props.description}</p>}
      </div>
      {props.actions}
    </header>
    {props.children}
  </section>
);

/** The Settings screen. A simple stacked layout of section cards. */
const SettingsScreen: Component = () => {
  const [editorOpen, setEditorOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<CustomTheme | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };
  const openEdit = (theme: CustomTheme) => {
    setEditing(theme);
    setEditorOpen(true);
  };

  return (
    <div class="flex flex-1 flex-col overflow-auto bg-bg p-4 sm:p-6">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Section
          title="Appearance"
          description="Choose a theme, or create your own colour scheme."
          actions={
            <Button variant="secondary" onClick={openCreate}>
              <PlusCircleIcon class="h-4 w-4" />
              Create theme
            </Button>
          }
        >
          <ThemeSwitcher onEdit={openEdit} />
        </Section>
      </div>

      <ThemeEditor open={editorOpen()} onOpenChange={setEditorOpen} editing={editing()} />
    </div>
  );
};

export default SettingsScreen;
