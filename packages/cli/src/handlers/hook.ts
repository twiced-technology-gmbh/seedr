import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { RegistryItem } from "@seedr/shared";
import { getItemContent } from "../config/registry.js";
import { getSettingsPath, AI_TOOLS } from "../config/tools.js";
import { exists } from "../utils/fs.js";
import { readJson, writeJson } from "../utils/json.js";
import type { ContentHandler, InstallResult } from "./types.js";

interface HookDefinition {
  event: string;
  matcher?: string;
  hooks: Array<{
    type: "command";
    command: string;
  }>;
}

interface SettingsJson {
  hooks?: Record<string, HookDefinition["hooks"]>;
  [key: string]: unknown;
}

/**
 * Parse hook definition from registry item content.
 * Expected format is JSON with event, matcher (optional), and hooks array.
 */
function parseHookDefinition(content: string): HookDefinition {
  try {
    return JSON.parse(content) as HookDefinition;
  } catch {
    throw new Error("Invalid hook definition: must be valid JSON");
  }
}

async function installHookForTool(
  item: RegistryItem,
  tool: AITool,
  scope: InstallScope,
  _method: InstallMethod,
  cwd: string
): Promise<InstallResult> {
  const spinner = ora(
    `Installing ${item.name} for ${AI_TOOLS[tool].name}...`
  ).start();

  try {
    if (tool !== "claude") {
      throw new Error("Hooks are only supported for Claude Code");
    }

    const content = await getItemContent(item);
    const hookDef = parseHookDefinition(content);

    const settingsPath = getSettingsPath(scope, cwd);
    const settings = await readJson<SettingsJson>(settingsPath);

    // Initialize hooks object if needed
    settings.hooks = settings.hooks || {};

    // Get the hook key (event + optional matcher)
    const hookKey = hookDef.matcher
      ? `${hookDef.event}:${hookDef.matcher}`
      : hookDef.event;

    // Merge hooks - append to existing or create new
    const existingHooks = settings.hooks[hookKey] || [];
    settings.hooks[hookKey] = [...existingHooks, ...hookDef.hooks];

    await writeJson(settingsPath, settings);

    spinner.succeed(
      chalk.green(`Installed ${item.name} for ${AI_TOOLS[tool].name}`)
    );
    return { tool, success: true, path: settingsPath };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    spinner.fail(
      chalk.red(`Failed to install for ${AI_TOOLS[tool].name}: ${errorMsg}`)
    );
    return { tool, success: false, path: "", error: errorMsg };
  }
}

export async function installHook(
  item: RegistryItem,
  tools: AITool[],
  scope: InstallScope,
  method: InstallMethod,
  cwd: string = process.cwd()
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const tool of tools) {
    const result = await installHookForTool(item, tool, scope, method, cwd);
    results.push(result);
  }

  return results;
}

export async function uninstallHook(
  _slug: string,
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<boolean> {
  if (tool !== "claude") return false;

  const settingsPath = getSettingsPath(scope, cwd);
  if (!(await exists(settingsPath))) return false;

  // Note: We can't easily uninstall a hook by slug since hooks are merged
  // into the settings.json. Would need to track which hooks came from which
  // registry item. For now, return false.
  return false;
}

export async function getInstalledHooks(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<string[]> {
  if (tool !== "claude") return [];

  const settingsPath = getSettingsPath(scope, cwd);
  if (!(await exists(settingsPath))) return [];

  const settings = await readJson<SettingsJson>(settingsPath);
  return Object.keys(settings.hooks || {});
}

/**
 * Hook content handler implementing the ContentHandler interface.
 */
export const hookHandler: ContentHandler = {
  type: "hook",

  async install(
    item: RegistryItem,
    tools: AITool[],
    scope: InstallScope,
    method: InstallMethod,
    cwd?: string
  ): Promise<InstallResult[]> {
    return installHook(item, tools, scope, method, cwd);
  },

  async uninstall(
    slug: string,
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<boolean> {
    return uninstallHook(slug, tool, scope, cwd);
  },

  async listInstalled(
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<string[]> {
    return getInstalledHooks(tool, scope, cwd);
  },
};
