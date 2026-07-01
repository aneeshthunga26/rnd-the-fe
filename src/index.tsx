import { render } from "solid-js/web";
import { Providers } from "./app/Providers";
import "./index.css";

const root = document.getElementById("app");
if (!root) throw new Error("Root element #app not found");

render(() => <Providers />, root);
