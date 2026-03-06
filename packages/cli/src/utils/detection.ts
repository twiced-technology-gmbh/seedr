import { exists } from "./fs.js";
import { AI_TOOLS, ALL_TOOLS, getToolPath } from "../config/tools.js";
import type { AITool, InstallScope } from "../types.js";

export interface DetectedTool {
  tool: AITool;
  scope: InstallScope;
  path: string;
}

export async function detectInstalledTools(
  cwd: string = process.cwd()
): Promise<DetectedTool[]> {
  const checks = ALL_TOOLS.flatMap((tool) => {
    const projectPath = getToolPath(tool, "project", cwd);
    const userPath = getToolPath(tool, "user", cwd);
    return [
      exists(projectPath).then((found): DetectedTool | null => found ? { tool, scope: "project", path: projectPath } : null),
      exists(userPath).then((found): DetectedTool | null => found ? { tool, scope: "user", path: userPath } : null),
    ];
  });
  const results = await Promise.all(checks);
  return results.filter((r): r is DetectedTool => r !== null);
}

export async function detectProjectTools(
  cwd: string = process.cwd()
): Promise<AITool[]> {
  const checks = ALL_TOOLS.map(async (tool) => {
    const projectPath = getToolPath(tool, "project", cwd);
    return (await exists(projectPath)) ? tool : null;
  });
  const results = await Promise.all(checks);
  return results.filter((t): t is AITool => t !== null);
}

export async function isToolInstalled(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<boolean> {
  // getToolPath only supports project and user scopes
  // local scope uses same path as project for skill detection
  const effectiveScope = scope === "local" ? "project" : scope;
  const path = getToolPath(tool, effectiveScope, cwd);
  return exists(path);
}

export function getToolDisplayName(tool: AITool): string {
  return AI_TOOLS[tool].name;
}

export function parseToolArg(arg: string): AITool | null {
  const normalized = arg.toLowerCase().trim();

  // Direct match
  if (ALL_TOOLS.includes(normalized as AITool)) {
    return normalized as AITool;
  }

  // Alias matching
  const aliases: Record<string, AITool> = {
    "claude-code": "claude",
    claudecode: "claude",
    cc: "claude",
    "github-copilot": "copilot",
    gh: "copilot",
    "gemini-code": "gemini",
    gca: "gemini",
    "openai-codex": "codex",
    oc: "opencode",
  };

  return aliases[normalized] ?? null;
}

export function parseToolsArg(agents: string, allTools: AITool[]): AITool[] {
  if (agents === "all") {
    return allTools;
  }
  return agents
    .split(",")
    .map((t) => parseToolArg(t.trim()))
    .filter((t): t is AITool => t !== null);
}
