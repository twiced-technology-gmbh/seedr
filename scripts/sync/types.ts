/**
 * Shared types for sync scripts.
 * These mirror the types in packages/cli and apps/web but are duplicated
 * here to keep scripts self-contained without build dependencies.
 */

export type ComponentType = "skill" | "plugin" | "agent" | "hook" | "mcp" | "command" | "settings";
export type SourceType = "official" | "community" | "toolr";

export interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export interface PluginContents {
  skills?: string[];
  agents?: string[];
  hooks?: string[];
  commands?: string[];
  mcpServers?: string[];
  files?: FileTreeNode[];
}

export interface ManifestItem {
  slug: string;
  name: string;
  type: ComponentType;
  description: string;
  longDescription?: string;
  compatibility: string[];
  featured?: boolean;
  sourceType: SourceType;
  contentHash?: string;
  author: { name: string; url?: string };
  externalUrl?: string;
  updatedAt?: string;
  contents?: PluginContents;
}

export interface Manifest {
  version: string;
  items: ManifestItem[];
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface GitTreeResponse {
  sha: string;
  tree: GitTreeItem[];
  truncated: boolean;
}
