import { createSignal, type ParentComponent, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Sidebar } from "../components/layout/Sidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { MobileDrawer } from "../components/layout/MobileDrawer";
import { StoreBar } from "../components/layout/StoreBar";
import { AppBar } from "../components/layout/AppBar";
import { PageHeaderProvider, useHeaderActions } from "../components/layout/PageHeader";
import { useIsMobile } from "../lib/useMediaQuery";
import { getRouteTitle } from "../routes/routeMeta";

/**
 * App shell. Owns the page header (AppBar/top bar) so screens stay pure content.
 * Desktop: sidebar + AppBar (title from route + screen-contributed actions).
 * Mobile: top bar with burger (nav drawer) + content + store bottom bar.
 */
const Shell: ParentComponent = (props) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const actions = useHeaderActions();
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const title = () => getRouteTitle(location.pathname);

  return (
    <Show
      when={isMobile()}
      fallback={
        <div class="flex h-screen overflow-hidden bg-bg">
          <Sidebar />
          <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppBar title={title()} actions={actions()} />
            {props.children}
          </main>
        </div>
      }
    >
      <div class="flex h-screen flex-col overflow-hidden bg-bg">
        <MobileHeader title={title()} onMenu={() => setDrawerOpen(true)} />
        <main class="flex min-h-0 flex-1 flex-col overflow-hidden">{props.children}</main>
        <StoreBar variant="bar" />
        <MobileDrawer open={drawerOpen()} onClose={() => setDrawerOpen(false)} />
      </div>
    </Show>
  );
};

export const AppLayout: ParentComponent = (props) => (
  <PageHeaderProvider>
    <Shell>{props.children}</Shell>
  </PageHeaderProvider>
);
