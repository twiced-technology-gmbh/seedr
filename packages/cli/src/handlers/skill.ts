import { join, dirname } from "node:path";
import chalk from "chalk";
import ora from "ora";
import type {
  AITool,
  InstallScope,
  InstallMethod,
  RegistryItem,
} from "../types.js";
import { getItemContent, getItemSourcePath } from "../config/registry.js";
import { getToolPath, AI_TOOLS } from "../config/tools.js";
import { convertSkillToTool, getOutputFilename } from "../utils/convert.js";
import {
  installFile,
  exists,
  ensureDir,
  writeTextFile,
  removeFile,
} from "../utils/fs.js";

export interface InstallResult {
  tool: AITool;
  success: boolean;
  path: string;
  error?: string;
}

async function getSkillContent(
  item: RegistryItem,
  tool: AITool
): Promise<string> {
  if (item.variants?.[tool]) {
    return getItemContent(item, tool);
  }
  const canonicalContent = await getItemContent(item);
  return convertSkillToTool(canonicalContent, tool);
}

async function writeSkillFile(
  item: RegistryItem,
  tool: AITool,
  content: string,
  destPath: string,
  method: InstallMethod
): Promise<void> {
  const canSymlink = tool === "claude" || item.variants?.[tool];

  const sourcePath = getItemSourcePath(
    item,
    item.variants?.[tool] ? tool : undefined
  );

  if (method === "symlink" && canSymlink && sourcePath) {
    await installFile(sourcePath, destPath, "symlink");
  } else {
    await ensureDir(dirname(destPath));
    await writeTextFile(destPath, content);
  }
}

async function installSkillForTool(
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
    const content = await getSkillContent(item, tool);
    const destDir = getToolPath(tool, scope, cwd);
    const filename = getOutputFilename(item.slug, tool);
    const destPath = join(destDir, filename);

    await writeSkillFile(item, tool, content, destPath, method);

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

  for (const tool of tools) {
    const result = await installSkillForTool(item, tool, scope, method, cwd);
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
  const destDir = getToolPath(tool, scope, cwd);
  const filename = getOutputFilename(slug, tool);
  const destPath = join(destDir, filename);

  if (!(await exists(destPath))) {
    return false;
  }

  return removeFile(destPath);
}

export async function getInstalledSkills(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<string[]> {
  const destDir = getToolPath(tool, scope, cwd);

  if (!(await exists(destDir))) {
    return [];
  }

  const { readdir } = await import("node:fs/promises");
  const files = await readdir(destDir);
  const config = AI_TOOLS[tool];

  return files
    .filter((f) => f.endsWith(config.skillExtension))
    .map((f) => f.replace(config.skillExtension, ""));
}
