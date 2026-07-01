import { type Component, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useFormat, useI18n } from "../../intl";
import { type CustomTheme, TOKENS, type ThemeVar, type ThemeVars, useTheme } from "../../theme";

interface ThemeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edit this theme; otherwise create a new one. */
  editing?: CustomTheme;
}

const uid = () => `theme-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Read the current computed value of a CSS variable off `<html>`. */
const computedVar = (name: string): string => {
  if (typeof document === "undefined") return "#000000";
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || "#000000";
};

/** Normalise arbitrary CSS colour strings to a `#rrggbb` value `<input type=color>` accepts. */
const toHexColor = (value: string): string => {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return (
      "#" +
      v
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
        .toLowerCase()
    );
  }
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return v.slice(0, 7).toLowerCase(); // rgb for the picker; alpha kept via alphaOf
  // Resolve named/rgb() colours via the canvas.
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = v;
        const resolved = ctx.fillStyle;
        if (/^#[0-9a-fA-F]{6}$/.test(resolved)) return resolved.toLowerCase();
      }
    } catch {
      /* fall through */
    }
  }
  return "#000000";
};

/**
 * The 2-char alpha suffix of an 8-digit hex (e.g. `#00000030` → `"30"`), else `""`.
 * `<input type=color>` is RGB-only, so we edit the `#rrggbb` part and re-append this
 * on preview/save to keep translucent tokens (e.g. `--color-overlay`) translucent.
 */
const alphaOf = (value: string): string => {
  const m = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})$/.exec(value.trim());
  return m ? m[1].toLowerCase() : "";
};

/** Relative luminance (WCAG) of a `#rrggbb` colour. */
const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};

/** WCAG contrast ratio between two `#rrggbb` colours. */
const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * Create / edit a custom theme. Renders one native colour input per TOKENS
 * entry, grouped by `group`, seeded from the edited theme or the current
 * computed values. Every change previews live by writing the variable on
 * `<html>`. Cancel restores the previously-active theme; Save persists and
 * activates the new theme.
 */
export const ThemeEditor: Component<ThemeEditorProps> = (props) => {
  const { t } = useI18n();
  const fmt = useFormat();
  const theme = useTheme();
  const defaultName = () => t("label.name");

  const seed = (): { name: string; vars: Record<string, string>; alpha: Record<string, string> } => {
    const vars: Record<string, string> = {};
    const alpha: Record<string, string> = {};
    for (const token of TOKENS) {
      const src = props.editing?.vars[token.var] ?? computedVar(token.var);
      vars[token.var] = toHexColor(src);
      alpha[token.var] = alphaOf(src);
    }
    return { name: props.editing?.name ?? defaultName(), vars, alpha };
  };

  const [name, setName] = createSignal("");
  const [vars, setVars] = createStore<Record<string, string>>({});
  // Per-token alpha suffix ("" for opaque tokens), preserved across the RGB picker.
  const [alpha, setAlpha] = createStore<Record<string, string>>({});
  const [id, setId] = createSignal("");

  /** The full value to apply/persist: picked #rrggbb + any preserved alpha. */
  const applied = (varName: string, rgb: string) => rgb + (alpha[varName] ?? "");

  // (Re)seed the form each time the editor opens (tracks `editing` too, so
  // opening it for a different theme reseeds). The Modal stays mounted and just
  // toggles `open`, so onMount alone wouldn't refresh the form.
  let wasOpen = false;
  createEffect(() => {
    const open = props.open;
    void props.editing; // track: reseed if the target theme changes while open
    if (open && !wasOpen) resetForm();
    wasOpen = open;
  });

  const resetForm = () => {
    const s = seed();
    setName(s.name);
    setVars(s.vars);
    setAlpha(s.alpha);
    setId(props.editing?.id ?? uid());
    // Apply the seed as a live preview immediately (re-appending preserved alpha).
    for (const [k, v] of Object.entries(s.vars)) applyPreview(k, v + (s.alpha[k] ?? ""));
  };

  const applyPreview = (name: string, value: string) => {
    if (typeof document !== "undefined") document.documentElement.style.setProperty(name, value);
  };

  const onColorInput = (varName: ThemeVar, value: string) => {
    setVars(varName, value);
    applyPreview(varName, applied(varName, value));
  };

  const groups = createMemo(() => {
    const order: string[] = [];
    for (const t of TOKENS) if (!order.includes(t.group)) order.push(t.group);
    return order.map((g) => ({ group: g, tokens: TOKENS.filter((t) => t.group === g) }));
  });

  const contrast = createMemo(() => {
    const fg = vars["--color-fg"];
    const bg = vars["--color-bg"];
    if (!fg || !bg) return null;
    return contrastRatio(fg, bg);
  });

  const cancel = () => {
    theme.reapply(); // restore the previously-active theme, discarding the preview
    props.onOpenChange(false);
  };

  const save = () => {
    const built: ThemeVars = {};
    for (const token of TOKENS) built[token.var] = applied(token.var, vars[token.var]);
    const custom: CustomTheme = { id: id(), name: name().trim() || defaultName(), vars: built };
    theme.saveCustomTheme(custom);
    theme.setTheme(custom.id);
    props.onOpenChange(false);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => (o ? props.onOpenChange(true) : cancel())}
      title={props.editing ? t("action.edit-theme") : t("action.create-theme")}
      width="560px"
      footer={
        <>
          <Button variant="ghost" onClick={cancel}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" onClick={save}>
            {t("action.save-theme")}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-5">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-muted">{t("label.name")}</span>
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            class="rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
            placeholder={defaultName()}
          />
        </label>

        <Show when={contrast() !== null}>
          <div
            class="rounded-md border border-line bg-surface px-3 py-2 text-xs"
            classList={{
              "text-danger": (contrast() ?? 0) < 4.5,
              "text-muted": (contrast() ?? 0) >= 4.5,
            }}
          >
            {t("message.contrast-ratio", {
              ratio: fmt().formatNumber(contrast() ?? 0, { maximumFractionDigits: 2 }),
            })}{" "}
            {(contrast() ?? 0) >= 4.5 ? t("message.passes-wcag-aa") : t("message.below-wcag-aa")}
          </div>
        </Show>

        <For each={groups()}>
          {(g) => (
            <div class="flex flex-col gap-2">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">{g.group}</h3>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <For each={g.tokens}>
                  {(t) => (
                    <label class="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
                      <input
                        type="color"
                        value={vars[t.var] ?? "#000000"}
                        onInput={(e) => onColorInput(t.var, e.currentTarget.value)}
                        class="h-7 w-7 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0"
                        aria-label={t.label}
                      />
                      <span class="flex-1 truncate text-sm text-fg">{t.label}</span>
                      <span class="font-mono text-xs text-muted">{vars[t.var]}</span>
                    </label>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
};
