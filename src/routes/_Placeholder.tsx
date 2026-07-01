import type { Component } from "solid-js";
import { useI18n } from "../intl";
import type { RouteTitleKey } from "./routeMeta";

/** Generic "coming soon" screen. `titleKey` is an app.* i18n key. */
export const Placeholder: Component<{ titleKey: RouteTitleKey }> = (props) => {
  const { t } = useI18n();
  return (
    <div class="flex flex-1 items-center justify-center text-muted">
      <p>{t("message.coming-soon", { title: t(props.titleKey) })}</p>
    </div>
  );
};
