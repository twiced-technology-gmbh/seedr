import { join } from "node:path";
import { mkdir, copyFile, chmod } from "node:fs/promises";
import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { RegistryItem } from "@seedr/shared";
import { getItemSourcePath, fetchItemToDestination } from "../config/registry.js";
import { getSettingsPath, AI_TOOLS } from "../config/tools.js";
import { exists } from "../utils/fs.js";
import { readJson, writeJson } from "../utils/json.js";
import type { ContentHandler, InstallResult } from "./types.js";

interface HookEntry {
  matcher?: string;
  hooks: Array<{
    type: "command";
    command: string;
  }>;
}

interface SettingsJson {
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
}

/**
 * Get the hooks directory path based on scope.
 */
function getHooksDir(scope: InstallScope, cwd: string): string {
  switch (scope) {
    case "user":
      return join(process.env.HOME || "~", ".claude", "hooks");
    case "project":
    case "local":
      return join(cwd, ".claude", "hooks");
  }
}

/**
 * Get the script path to use in settings.json based on scope.
 */
function getScriptPath(scope: InstallScope, scriptName: string): string {
  switch (scope) {
    case "user":
      return `~/.claude/hooks/${scriptName}`;
    case "project":
    case "local":
      return `.claude/hooks/${scriptName}`;
  }
}

/**
 * Find the main script file from the item's files.
 */
function findScriptFile(item: RegistryItem): string | null {
  const files = item.contents?.files;
  if (!files) return null;

  // Look for .sh files at the top level
  for (const file of files) {
    if (file.type === "file" && file.name.endsWith(".sh")) {
      return file.name;
    }
  }

  return null;
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

    // Get triggers from manifest
    const triggers = item.contents?.triggers;
    if (!triggers || triggers.length === 0) {
      throw new Error("No triggers defined for this hook");
    }

    // Find the script file
    const scriptFile = findScriptFile(item);
    if (!scriptFile) {
      throw new Error("No script file found in hook");
    }

    // Step 1: Copy script to hooks directory
    const hooksDir = getHooksDir(scope, cwd);
    await mkdir(hooksDir, { recursive: true });

    const sourcePath = getItemSourcePath(item);
    const destScriptPath = join(hooksDir, scriptFile);

    if (sourcePath && (await exists(sourcePath))) {
      // Local registry - copy or symlink based on method
      const sourceScriptPath = join(sourcePath, scriptFile);
      await copyFile(sourceScriptPath, destScriptPath);
    } else {
      // Remote - fetch to temp then copy script
      const tempDir = join(cwd, ".claude", ".tmp", item.slug);
      await fetchItemToDestination(item, tempDir);
      await copyFile(join(tempDir, scriptFile), destScriptPath);
      // Clean up temp dir
      const { rm } = await import("node:fs/promises");
      await rm(tempDir, { recursive: true, force: true });
    }

    // Make script executable
    await chmod(destScriptPath, 0o755);

    // Step 2: Update settings with triggers
    const settingsPath = getSettingsPath(scope, cwd);
    const settings = await readJson<SettingsJson>(settingsPath);
    settings.hooks = settings.hooks || {};

    const scriptPath = getScriptPath(scope, scriptFile);

    for (const trigger of triggers) {
      const event = trigger.event;
      const matcher = trigger.matcher;

      // Initialize event array if needed
      if (!settings.hooks[event]) {
        settings.hooks[event] = [];
      }

      // Check if there's already an entry with this matcher
      const existingEntry = settings.hooks[event].find(
        (e) => e.matcher === matcher
      );

      const hookCommand = { type: "command" as const, command: scriptPath };

      if (existingEntry) {
        // Add to existing entry if not already present
        const alreadyExists = existingEntry.hooks.some(
          (h) => h.command === scriptPath
        );
        if (!alreadyExists) {
          existingEntry.hooks.push(hookCommand);
        }
      } else {
        // Create new entry
        const newEntry: HookEntry = {
          hooks: [hookCommand],
        };
        if (matcher) {
          newEntry.matcher = matcher;
        }
        settings.hooks[event].push(newEntry);
      }
    }

    await writeJson(settingsPath, settings);

    spinner.succeed(
      chalk.green(`Installed ${item.name} for ${AI_TOOLS[tool].name}`)
    );
    return { tool, success: true, path: destScriptPath };
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
