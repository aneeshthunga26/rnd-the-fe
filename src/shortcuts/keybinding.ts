// Keybinding model: parse("ctrl+k") <-> matches(event) <-> format(binding).
// A binding is normalised modifier flags + a lower-cased key. `mod` is a
// platform alias: Ctrl on Windows/Linux, Cmd (meta) on mac — matched loosely
// against either ctrlKey or metaKey so a single "mod+k" default works everywhere.

export interface KeyBinding {
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  /** whether the string used the `mod` alias (Ctrl/Cmd) */
  mod?: boolean;
  /** lower-cased key, e.g. "k" */
  key: string;
}

/** True on macOS (best-effort platform detection). */
export const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    navigator.userAgent ??
    "";
  return /mac|iphone|ipad|ipod/i.test(platform);
};

/**
 * Parse a binding string like "ctrl+k", "mod+k" or "ctrl+shift+p" into a binding.
 * Tokens are `+`-separated, case-insensitive; the final token is the key.
 */
export const parse = (str: string): KeyBinding => {
  const tokens = str
    .split("+")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const binding: KeyBinding = { key: "" };
  for (const token of tokens) {
    switch (token) {
      case "ctrl":
      case "control":
        binding.ctrl = true;
        break;
      case "meta":
      case "cmd":
      case "command":
      case "super":
      case "win":
        binding.meta = true;
        break;
      case "mod":
        binding.mod = true;
        break;
      case "alt":
      case "option":
        binding.alt = true;
        break;
      case "shift":
        binding.shift = true;
        break;
      default:
        binding.key = token;
    }
  }
  return binding;
};

/** Serialise a binding back to a canonical string (e.g. "mod+shift+p"). */
export const stringify = (b: KeyBinding): string => {
  const parts: string[] = [];
  if (b.mod) parts.push("mod");
  if (b.ctrl) parts.push("ctrl");
  if (b.meta) parts.push("meta");
  if (b.alt) parts.push("alt");
  if (b.shift) parts.push("shift");
  parts.push(b.key);
  return parts.join("+");
};

/** True when the keyboard event's modifiers + key match the binding. */
export const matches = (b: KeyBinding, e: KeyboardEvent): boolean => {
  if (e.key.toLowerCase() !== b.key) return false;
  // `mod` matches either Ctrl or Cmd.
  if (b.mod) {
    if (!(e.ctrlKey || e.metaKey)) return false;
  } else {
    if (Boolean(b.ctrl) !== e.ctrlKey) return false;
    if (Boolean(b.meta) !== e.metaKey) return false;
  }
  if (Boolean(b.alt) !== e.altKey) return false;
  if (Boolean(b.shift) !== e.shiftKey) return false;
  return true;
};

/** Human display string, e.g. "Ctrl K" (or "⌘K" on mac). */
export const format = (b: KeyBinding): string => {
  const mac = isMac();
  const parts: string[] = [];
  if (b.mod) parts.push(mac ? "⌘" : "Ctrl");
  if (b.ctrl) parts.push(mac ? "⌃" : "Ctrl");
  if (b.meta) parts.push(mac ? "⌘" : "Win");
  if (b.alt) parts.push(mac ? "⌥" : "Alt");
  if (b.shift) parts.push(mac ? "⇧" : "Shift");
  const key = b.key.length === 1 ? b.key.toUpperCase() : capitalize(b.key);
  parts.push(key);
  // On mac symbols read best without spaces (⌘K); elsewhere space-separate.
  return mac ? parts.join("") : parts.join(" ");
};

const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Build a binding from a captured keydown event (for the rebind recorder). */
export const fromEvent = (e: KeyboardEvent): KeyBinding => ({
  ctrl: e.ctrlKey,
  meta: e.metaKey,
  alt: e.altKey,
  shift: e.shiftKey,
  key: e.key.toLowerCase(),
});

/** Modifier keys that shouldn't count as a completed combo on their own. */
export const isModifierKey = (key: string): boolean =>
  ["control", "meta", "alt", "shift", "os", "hyper", "super"].includes(key.toLowerCase());
