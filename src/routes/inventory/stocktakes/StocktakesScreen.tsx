import type { Component } from "solid-js";
import { ListView } from "./ListView";

// Route entry for /inventory/stocktakes. Thin on purpose: it composes the
// stocktake views. A DetailView will slot in beside ListView later.
const StocktakesScreen: Component = () => <ListView />;

export default StocktakesScreen;
