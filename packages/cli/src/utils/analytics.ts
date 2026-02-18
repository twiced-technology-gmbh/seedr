import { createRequire } from "node:module";
import type { InstallResult } from "../handlers/types.js";
import type { InstallScope, ComponentType } from "../types.js";

const require = createRequire(import.meta.url);
const { version: CLI_VERSION } = require("../../package.json");

const ANALYTICS_URL = "https://seedr.toolr.dev/api/installs";

export function trackInstalls(
  slug: string,
  type: ComponentType,
  results: InstallResult[],
  scope: InstallScope
): void {
  if (process.env.SEEDR_NO_TELEMETRY) return;

  for (const result of results) {
    if (!result.success) continue;

    fetch(ANALYTICS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        type,
        tool: result.tool,
        scope,
        version: CLI_VERSION,
      }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
  }
}
