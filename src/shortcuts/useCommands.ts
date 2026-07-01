import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";
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

  return createMemo<Command[]>(() =>
    Object.entries(ROUTES)
      .filter(([, path]) => !path.includes(":"))
      .map(([id, path]) => ({
        id,
        title: getRouteTitle(path) || path,
        path,
        keywords: path,
        run: () => navigate(path),
      })),
  );
};
