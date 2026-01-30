import { homedir } from "node:os";
import { join } from "node:path";
import type { AITool, AIToolConfig } from "../types.js";

const home = homedir();

// Shared constants to avoid duplicate string literals
const SKILL_FORMAT_MARKDOWN = "markdown";
const SKILL_EXTENSION_MD = ".md";
const COPILOT_PATH = ".github/copilot-instructions";
const OPENCODE_PATH = ".opencode/agents";

export const AI_TOOLS: Record<AITool, AIToolConfig> = {
  claude: {
    name: "Claude Code",
    shortName: "claude",
    projectPath: ".claude/commands",
    userPath: join(home, ".claude/commands"),
    globalPath: "/Library/Application Support/ClaudeCode/commands",
    skillFormat: SKILL_FORMAT_MARKDOWN,
    skillExtension: SKILL_EXTENSION_MD,
    skillDir: "commands",
  },
  copilot: {
    name: "GitHub Copilot",
    shortName: "copilot",
    projectPath: COPILOT_PATH,
    userPath: join(home, COPILOT_PATH),
    globalPath: join(home, COPILOT_PATH),
    skillFormat: SKILL_FORMAT_MARKDOWN,
    skillExtension: ".instructions.md",
    skillDir: "copilot-instructions",
  },
  gemini: {
    name: "Gemini Code Assist",
    shortName: "gemini",
    projectPath: ".gemini",
    userPath: join(home, ".gemini"),
    globalPath: join(home, ".gemini"),
    skillFormat: SKILL_FORMAT_MARKDOWN,
    skillExtension: SKILL_EXTENSION_MD,
    skillDir: ".gemini",
  },
  codex: {
    name: "OpenAI Codex",
    shortName: "codex",
    projectPath: ".codex",
    userPath: join(home, ".codex"),
    globalPath: join(home, ".codex"),
    skillFormat: SKILL_FORMAT_MARKDOWN,
    skillExtension: SKILL_EXTENSION_MD,
    skillDir: ".codex",
  },
  opencode: {
    name: "OpenCode",
    shortName: "opencode",
    projectPath: OPENCODE_PATH,
    userPath: join(home, OPENCODE_PATH),
    globalPath: join(home, OPENCODE_PATH),
    skillFormat: SKILL_FORMAT_MARKDOWN,
    skillExtension: SKILL_EXTENSION_MD,
    skillDir: "agents",
  },
};

export const ALL_TOOLS = Object.keys(AI_TOOLS) as AITool[];

export function getToolConfig(tool: AITool): AIToolConfig {
  return AI_TOOLS[tool];
}

export function getToolPath(
  tool: AITool,
  scope: "project" | "user" | "global",
  cwd: string = process.cwd()
): string {
  const config = AI_TOOLS[tool];
  switch (scope) {
    case "project":
      return join(cwd, config.projectPath);
    case "user":
      return config.userPath;
    case "global":
      return config.globalPath;
  }
}
