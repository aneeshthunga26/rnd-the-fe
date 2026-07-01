import { Navigate, Route, Router } from "@solidjs/router";
import type { Component } from "solid-js";
import { buildRoutes } from "./routes/registry";
import { ROUTES } from "./routes/routes";

const App: Component = () => {
  return (
    <Router>
      {buildRoutes()}
      <Route path="*" component={() => <Navigate href={ROUTES.stocktakes} />} />
    </Router>
  );
};

export default App;
