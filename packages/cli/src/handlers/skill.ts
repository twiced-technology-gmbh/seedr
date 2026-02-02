import { join, relative, dirname } from "node:path";
import { readdir, symlink } from "node:fs/promises";
import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { RegistryItem } from "@seedr/shared";
import {
  getItemSourcePath,
  fetchItemToDestination,
} from "../config/registry.js";
import { getContentPath, AI_TOOLS } from "../config/tools.js";
import {
  exists,
  installDirectory,
  copyDirectory,
  ensureDir,
  getAgentsPath,
} from "../utils/fs.js";
import type { ContentHandler, InstallResult } from "./types.js";

/**
 * Install skill to the central .agents/skills/<name> location.
 * Returns the path to the central location.
 */
async function installToCentralLocation(
  item: RegistryItem,
  sourcePath: string | null,
  cwd: string
): Promise<string> {
  const centralPath = getAgentsPath("skill", item.slug, cwd);

  // Remove existing if present
  if (await exists(centralPath)) {
    const { rm } = await import("node:fs/promises");
    await rm(centralPath, { recursive: true });
  }

  // Copy from local or fetch from remote
  if (sourcePath && (await exists(sourcePath))) {
    await copyDirectory(sourcePath, centralPath);
  } else {
    await fetchItemToDestination(item, centralPath);
  }

  return centralPath;
}

/**
 * Create a symlink from the tool's skill directory to the central location.
 */
async function createToolSymlink(
  centralPath: string,
  destPath: string
): Promise<void> {
  await ensureDir(dirname(destPath));

  // Remove existing if present
  if (await exists(destPath)) {
    const { rm } = await import("node:fs/promises");
    await rm(destPath, { recursive: true });
  }

  // Create relative symlink for portability
  const relPath = relative(dirname(destPath), centralPath);
  await symlink(relPath, destPath);
}

async function installSkillForTool(
  item: RegistryItem,
  tool: AITool,
  scope: InstallScope,
  method: InstallMethod,
  cwd: string,
  centralPath?: string
): Promise<InstallResult> {
  const spinner = ora(
    `Installing ${item.name} for ${AI_TOOLS[tool].name}...`
  ).start();

  try {
    const destDir = getContentPath(tool, "skill", scope, cwd);
    if (!destDir) {
      throw new Error(`${AI_TOOLS[tool].name} does not support skills`);
    }

    const destPath = join(destDir, item.slug);
    const sourcePath = getItemSourcePath(item);

    if (method === "symlink" && centralPath) {
      // Symlink mode: link from tool folder to central .agents location
      await createToolSymlink(centralPath, destPath);
    } else if (sourcePath && (await exists(sourcePath))) {
      // Copy mode: copy directly from local registry
      await installDirectory(sourcePath, destPath, "copy");
    } else {
      // Fetch from remote (when running via npx or for external items)
      await fetchItemToDestination(item, destPath);
    }

    spinner.succeed(
      chalk.green(`Installed ${item.name} for ${AI_TOOLS[tool].name}`)
    );
    return { tool, success: true, path: destPath };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    spinner.fail(
      chalk.red(`Failed to install for ${AI_TOOLS[tool].name}: ${errorMsg}`)
    );
    return { tool, success: false, path: "", error: errorMsg };
  }
}

export async function installSkill(
  item: RegistryItem,
  tools: AITool[],
  scope: InstallScope,
  method: InstallMethod,
  cwd: string = process.cwd()
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  const sourcePath = getItemSourcePath(item);

  // For symlink mode, first install to central .agents location
  let centralPath: string | undefined;
  if (method === "symlink") {
    centralPath = await installToCentralLocation(item, sourcePath, cwd);
  }

  for (const tool of tools) {
    const result = await installSkillForTool(
      item,
      tool,
      scope,
      method,
      cwd,
      centralPath
    );
    results.push(result);
  }

  return results;
}

export async function uninstallSkill(
  slug: string,
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<boolean> {
  const destDir = getContentPath(tool, "skill", scope, cwd);
  if (!destDir) return false;

  const destPath = join(destDir, slug);

  if (!(await exists(destPath))) {
    return false;
  }

  // Remove directory
  const { rm } = await import("node:fs/promises");
  try {
    await rm(destPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export async function getInstalledSkills(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<string[]> {
  const destDir = getContentPath(tool, "skill", scope, cwd);
  if (!destDir || !(await exists(destDir))) {
    return [];
  }

  const entries = await readdir(destDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Skill content handler implementing the ContentHandler interface.
 */
export const skillHandler: ContentHandler = {
  type: "skill",

  async install(
    item: RegistryItem,
    tools: AITool[],
    scope: InstallScope,
    method: InstallMethod,
    cwd?: string
  ): Promise<InstallResult[]> {
    return installSkill(item, tools, scope, method, cwd);
  },

  async uninstall(
    slug: string,
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<boolean> {
    return uninstallSkill(slug, tool, scope, cwd);
  },

  async listInstalled(
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<string[]> {
    return getInstalledSkills(tool, scope, cwd);
  },
};

// Re-export types for backward compatibility
export type { InstallResult } from "./types.js";
