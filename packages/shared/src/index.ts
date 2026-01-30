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

export interface Author {
  name: string;
  url?: string;
}

export interface RegistryItem {
  slug: string;
  name: string;
  type: ComponentType;
  description: string;
  longDescription?: string;
  compatibility: AITool[];
  featured?: boolean;
  source?: string;
  package?: string;
  variants?: Partial<Record<AITool, string>>;
  sourceType?: SourceType;
  author?: Author;
  externalUrl?: string;
  updatedAt?: string;
}

export interface RegistryManifest {
  version: string;
  items: RegistryItem[];
}
