import { Navigate, Route, Router } from "@solidjs/router";
import type { Component, ParentComponent } from "solid-js";
import { buildRoutes } from "./routes/registry";
import { ROUTES } from "./routes/routes";
import { ShortcutsProvider } from "./shortcuts";

/**
 * Router root: wraps every route so router-context-dependent providers can use
 * hooks like `useNavigate`. ShortcutsProvider lives here (not in Providers.tsx)
 * because its command palette navigates via the router.
 */
const AppRoot: ParentComponent = (props) => (
  <ShortcutsProvider>{props.children}</ShortcutsProvider>
);

const App: Component = () => {
  return (
    <Router root={AppRoot}>
      {buildRoutes()}
      <Route path="*" component={() => <Navigate href={ROUTES.stocktakes} />} />
    </Router>
  );
};

export default App;
