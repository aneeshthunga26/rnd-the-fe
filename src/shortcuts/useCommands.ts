import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";
import { useI18n } from "../intl";
import { getRouteTitle } from "../routes/routeMeta";
import { ROUTES } from "../routes/routes";

/** A palette command. Designed as data so non-navigation commands can be added later. */
export interface Command {
  id: string;
  title: string;
  path: string;
  keywords?: string;
  run: () => void;
}

/**
 * Build a navigate-to-screen command per registered screen from ROUTES +
 * routeMeta titles. Dynamic/detail routes (paths containing ":") are excluded.
 */
export const useCommands = (): (() => Command[]) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Titles are translated inside the memo so it tracks locale: switching language
  // re-derives every command title (getRouteTitle returns an i18n key, not text).
  const commands = createMemo<Command[]>(() =>
    Object.entries(ROUTES)
      .filter(([, path]) => !path.includes(":"))
      .map(([id, path]) => {
        const key = getRouteTitle(path);
        return {
          id,
          title: key ? t(key) : path,
          path,
          keywords: path,
          run: () => navigate(path),
        };
      }),
  );
  return commands;
};
