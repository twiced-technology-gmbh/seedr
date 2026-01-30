/**
 * Shared types for sync scripts.
 * These mirror the types in packages/cli and apps/web but are duplicated
 * here to keep scripts self-contained without build dependencies.
 */

export type ComponentType = "skill" | "plugin" | "agent" | "hook" | "mcp" | "command" | "settings";
export type SourceType = "official" | "community" | "toolr";

export interface ManifestItem {
  slug: string;
  name: string;
  type: ComponentType;
  description: string;
  longDescription?: string;
  compatibility: string[];
  featured?: boolean;
  sourceType: SourceType;
  author: { name: string; url?: string };
  externalUrl?: string;
  updatedAt?: string;
}

export interface Manifest {
  version: string;
  items: ManifestItem[];
}
