import { createSignal, type ParentComponent, Show, Suspense } from "solid-js";
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
/** Small centered spinner shown while a lazy route chunk loads. */
const RouteFallback: ParentComponent = () => (
  <div class="flex flex-1 items-center justify-center">
    <div class="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
  </div>
);

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
            <Suspense fallback={<RouteFallback />}>{props.children}</Suspense>
          </main>
        </div>
      }
    >
      <div class="flex h-screen flex-col overflow-hidden bg-bg">
        <MobileHeader title={title()} onMenu={() => setDrawerOpen(true)} />
        <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Suspense fallback={<RouteFallback />}>{props.children}</Suspense>
        </main>
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
