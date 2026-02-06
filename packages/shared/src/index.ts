export type AITool = "claude" | "copilot" | "gemini" | "codex" | "opencode";

export type ComponentType =
  | "skill"
  | "hook"
  | "agent"
  | "plugin"
  | "command"
  | "settings"
  | "mcp";

export type SourceType = "official" | "toolr" | "community";

export type ScopeType = "user" | "project" | "local";

export interface Author {
  name: string;
  url?: string;
}

export interface PluginContents {
  skills?: string[];
  agents?: string[];
  hooks?: string[];
  commands?: string[];
  mcpServers?: string[];
  files?: FileTreeNode[];
}

export interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export interface RegistryItem {
  slug: string;
  name: string;
  type: ComponentType;
  description: string;
  longDescription?: string;
  compatibility: AITool[];
  featured?: boolean;
  sourceType?: SourceType;
  recommendedScope?: ScopeType;
  author?: Author;
  externalUrl?: string;
  updatedAt?: string;
  contents?: PluginContents;
}

export interface RegistryManifest {
  version: string;
  items: RegistryItem[];
}
