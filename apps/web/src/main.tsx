import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, ACCENT_DEFS } from "@toolr/ui-design";
import { App } from "./App";
import "./styles/index.css";

const cyan = ACCENT_DEFS.find(a => a.id === "cyan")!;
applyTheme("dark", cyan.hue);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
