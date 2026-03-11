import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, ACCENT_DEFS } from "@toolr/ui-design";
import { App } from "./App";
import "./styles/index.css";

const green = ACCENT_DEFS.find(a => a.id === "green")!;
applyTheme("dark", green.hue);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
