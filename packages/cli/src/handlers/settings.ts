import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { RegistryItem } from "@seedr/shared";
import { getItemContent } from "../config/registry.js";
import { getSettingsPath, AI_TOOLS } from "../config/tools.js";
import { exists } from "../utils/fs.js";
import { readJson, writeJson, deepMerge } from "../utils/json.js";
import type { ContentHandler, InstallResult } from "./types.js";

type SettingsJson = Record<string, unknown>;

/**
 * Parse settings content from registry item.
 * Expected format is valid JSON.
 */
function parseSettings(content: string): SettingsJson {
  try {
    return JSON.parse(content) as SettingsJson;
  } catch {
    throw new Error("Invalid settings: must be valid JSON");
  }
}

async function installSettingsForTool(
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
      throw new Error("Settings are only supported for Claude Code");
    }

    const content = await getItemContent(item);
    const newSettings = parseSettings(content);

    const settingsPath = getSettingsPath(scope, cwd);
    const existingSettings = await readJson<SettingsJson>(settingsPath);

    // Deep merge new settings into existing
    const merged = deepMerge(existingSettings, newSettings);

    await writeJson(settingsPath, merged);

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

export async function installSettings(
  item: RegistryItem,
  tools: AITool[],
  scope: InstallScope,
  method: InstallMethod,
  cwd: string = process.cwd()
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const tool of tools) {
    const result = await installSettingsForTool(item, tool, scope, method, cwd);
    results.push(result);
  }

  return results;
}

export async function uninstallSettings(
  _slug: string,
  _tool: AITool,
  _scope: InstallScope,
  _cwd: string = process.cwd()
): Promise<boolean> {
  // Settings are merged and can't be easily uninstalled
  return false;
}

export async function getInstalledSettings(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<string[]> {
  if (tool !== "claude") return [];

  const settingsPath = getSettingsPath(scope, cwd);
  if (!(await exists(settingsPath))) return [];

  // Settings don't have discrete "installed" items
  // Return an empty array or could return the settings keys
  return [];
}

/**
 * Settings content handler implementing the ContentHandler interface.
 */
export const settingsHandler: ContentHandler = {
  type: "settings",

  async install(
    item: RegistryItem,
    tools: AITool[],
    scope: InstallScope,
    method: InstallMethod,
    cwd?: string
  ): Promise<InstallResult[]> {
    return installSettings(item, tools, scope, method, cwd);
  },

  async uninstall(
    slug: string,
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<boolean> {
    return uninstallSettings(slug, tool, scope, cwd);
  },

  async listInstalled(
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<string[]> {
    return getInstalledSettings(tool, scope, cwd);
  },
};
