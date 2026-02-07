import type { ComponentType, AITool, SourceType, ScopeType } from "./types";

// Badge color type matching the Badge component
export type BadgeColor =
  | "gray"
  | "green"
  | "red"
  | "blue"
  | "yellow"
  | "orange"
  | "purple"
  | "pink"
  | "cyan"
  | "emerald"
  | "amber"
  | "teal"
  | "indigo"
  | "slate"
  | "violet"
  | "sky";

// Type labels for display (singular)
export const typeLabels: Record<ComponentType, string> = {
  skill: "Skill",
  hook: "Hook",
  agent: "Agent",
  plugin: "Plugin",
  command: "Command",
  settings: "Settings",
  mcp: "MCP Server",
};

// Type labels for display (plural)
export const typeLabelPlural: Record<ComponentType, string> = {
  skill: "Skills",
  hook: "Hooks",
  agent: "Agents",
  plugin: "Plugins",
  command: "Commands",
  settings: "Settings",
  mcp: "MCP Servers",
};

// Type to badge color mapping (matching configr's extensionColors)
export const typeToBadgeColor: Record<ComponentType, BadgeColor> = {
  skill: "pink",
  command: "amber",
  hook: "purple",
  agent: "blue",
  mcp: "teal",
  settings: "orange",
  plugin: "indigo",
};

// Type border colors for card indicators (using -500 to match configr)
export const typeBorderColors: Record<ComponentType, string> = {
  skill: "border-l-pink-500",
  command: "border-l-amber-500",
  hook: "border-l-purple-500",
  agent: "border-l-blue-500",
  mcp: "border-l-teal-500",
  settings: "border-l-orange-500",
  plugin: "border-l-indigo-500",
};

// Type icon/text colors (matching configr)
export const typeTextColors: Record<ComponentType, string> = {
  skill: "text-pink-500",
  command: "text-amber-500",
  hook: "text-purple-500",
  agent: "text-blue-500",
  mcp: "text-teal-500",
  settings: "text-orange-500",
  plugin: "text-indigo-500",
};

// Source to badge color mapping
export const sourceToBadgeColor: Record<SourceType, BadgeColor> = {
  official: "amber",
  toolr: "blue",
  community: "emerald",
};

export const sourceLabels: Record<SourceType, string> = {
  official: "Official",
  toolr: "Toolr",
  community: "Community",
};

export const toolLabels: Record<AITool, string> = {
  claude: "Claude Code",
  copilot: "GitHub Copilot",
  gemini: "Gemini",
  codex: "Codex",
  opencode: "OpenCode",
};

// Tool badge colors
export const toolToBadgeColor: Record<AITool, BadgeColor> = {
  claude: "orange",
  copilot: "green",
  gemini: "blue",
  codex: "emerald",
  opencode: "purple",
};

// Scope to badge color mapping
export const scopeToBadgeColor: Record<ScopeType, BadgeColor> = {
  user: "violet",
  project: "cyan",
  local: "slate",
};

export const scopeLabels: Record<ScopeType, string> = {
  user: "User",
  project: "Project",
  local: "Local",
};
