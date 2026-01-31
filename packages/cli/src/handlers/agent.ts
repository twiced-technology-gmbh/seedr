import { join } from "node:path";
import { readdir } from "node:fs/promises";
import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { RegistryItem } from "@seedr/shared";
import { getItemContent, getItemSourcePath } from "../config/registry.js";
import { getContentPath, AI_TOOLS } from "../config/tools.js";
import { exists, ensureDir, writeTextFile, installFile, removeFile } from "../utils/fs.js";
import type { ContentHandler, InstallResult } from "./types.js";

async function installAgentForTool(
  item: RegistryItem,
  tool: AITool,
  scope: InstallScope,
  method: InstallMethod,
  cwd: string
): Promise<InstallResult> {
  const spinner = ora(
    `Installing ${item.name} for ${AI_TOOLS[tool].name}...`
  ).start();

  try {
    const destDir = getContentPath(tool, "agent", scope, cwd);
    if (!destDir) {
      throw new Error(`${AI_TOOLS[tool].name} does not support agents`);
    }

    const destPath = join(destDir, `${item.slug}.md`);
    const sourcePath = getItemSourcePath(item);

    // Try symlink for local toolr items, otherwise copy
    if (sourcePath && method === "symlink") {
      const sourceFile = join(sourcePath, "AGENT.md");
      if (await exists(sourceFile)) {
        await installFile(sourceFile, destPath, "symlink");
      } else {
        // Fall back to content copy
        const content = await getItemContent(item);
        await ensureDir(destDir);
        await writeTextFile(destPath, content);
      }
    } else {
      const content = await getItemContent(item);
      await ensureDir(destDir);
      await writeTextFile(destPath, content);
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

export async function installAgent(
  item: RegistryItem,
  tools: AITool[],
  scope: InstallScope,
  method: InstallMethod,
  cwd: string = process.cwd()
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const tool of tools) {
    const result = await installAgentForTool(item, tool, scope, method, cwd);
    results.push(result);
  }

  return results;
}

export async function uninstallAgent(
  slug: string,
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<boolean> {
  const destDir = getContentPath(tool, "agent", scope, cwd);
  if (!destDir) return false;

  const destPath = join(destDir, `${slug}.md`);

  if (!(await exists(destPath))) {
    return false;
  }

  return removeFile(destPath);
}

export async function getInstalledAgents(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<string[]> {
  const destDir = getContentPath(tool, "agent", scope, cwd);
  if (!destDir || !(await exists(destDir))) {
    return [];
  }

  const files = await readdir(destDir);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

/**
 * Agent content handler implementing the ContentHandler interface.
 */
export const agentHandler: ContentHandler = {
  type: "agent",

  async install(
    item: RegistryItem,
    tools: AITool[],
    scope: InstallScope,
    method: InstallMethod,
    cwd?: string
  ): Promise<InstallResult[]> {
    return installAgent(item, tools, scope, method, cwd);
  },

  async uninstall(
    slug: string,
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<boolean> {
    return uninstallAgent(slug, tool, scope, cwd);
  },

  async listInstalled(
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<string[]> {
    return getInstalledAgents(tool, scope, cwd);
  },
};
