import type { AITool, ComponentType } from "../types.js";

/**
 * Maps content types to the AI tools that support them.
 * Skills and MCP are cross-platform, everything else is Claude-only.
 */
export const TOOL_COMPATIBILITY: Record<ComponentType, AITool[]> = {
  skill: ["claude", "copilot", "gemini", "codex", "opencode"],
  command: ["claude"],
  agent: ["claude"],
  hook: ["claude"],
  plugin: ["claude"],
  settings: ["claude"],
  mcp: ["claude", "copilot", "gemini", "codex", "opencode"],
};

/**
 * Check if a content type is supported by a specific tool.
 */
export function isTypeSupported(type: ComponentType, tool: AITool): boolean {
  return TOOL_COMPATIBILITY[type].includes(tool);
}

/**
 * Get all tools that support a given content type.
 */
export function getCompatibleTools(type: ComponentType): AITool[] {
  return TOOL_COMPATIBILITY[type];
}

/**
 * Filter tools to only those that support the given content type.
 */
export function filterCompatibleTools(
  type: ComponentType,
  tools: AITool[]
): AITool[] {
  const compatible = TOOL_COMPATIBILITY[type];
  return tools.filter((t) => compatible.includes(t));
}
