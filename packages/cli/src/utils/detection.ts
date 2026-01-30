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
  const detected: DetectedTool[] = [];

  for (const tool of ALL_TOOLS) {
    // Check project scope
    const projectPath = getToolPath(tool, "project", cwd);
    if (await exists(projectPath)) {
      detected.push({ tool, scope: "project", path: projectPath });
    }

    // Check user scope
    const userPath = getToolPath(tool, "user", cwd);
    if (await exists(userPath)) {
      detected.push({ tool, scope: "user", path: userPath });
    }
  }

  return detected;
}

export async function detectProjectTools(
  cwd: string = process.cwd()
): Promise<AITool[]> {
  const detected: AITool[] = [];

  for (const tool of ALL_TOOLS) {
    const projectPath = getToolPath(tool, "project", cwd);
    if (await exists(projectPath)) {
      detected.push(tool);
    }
  }

  return detected;
}

export async function isToolInstalled(
  tool: AITool,
  scope: InstallScope,
  cwd: string = process.cwd()
): Promise<boolean> {
  const path = getToolPath(tool, scope, cwd);
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
