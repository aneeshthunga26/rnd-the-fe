import { Navigate, Route, Router } from "@solidjs/router";
import type { Component } from "solid-js";
import { StocktakesPage } from "./stocktakes/StocktakesPage";

const App: Component = () => {
  return (
    <Router>
      <Route path="/stocktakes" component={StocktakesPage} />
      <Route path="*" component={() => <Navigate href="/stocktakes" />} />
    </Router>
  );
};

export default App;
