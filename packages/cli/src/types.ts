// Re-export shared types
export type {
  AITool,
  ComponentType,
  RegistryItem,
  RegistryManifest,
} from "@seedr/shared";

// CLI-only types
export type InstallScope = "project" | "user" | "global";

export type InstallMethod = "symlink" | "copy";

export interface AIToolConfig {
  name: string;
  shortName: string;
  projectPath: string;
  userPath: string;
  globalPath: string;
  skillFormat: "markdown" | "yaml" | "json";
  skillExtension: string;
  skillDir: string;
}

export interface InstallOptions {
  skill?: string;
  agents?: string[] | "all";
  scope?: InstallScope;
  method?: InstallMethod;
  yes?: boolean;
  force?: boolean;
}

export interface InstalledItem {
  slug: string;
  type: string;
  tool: string;
  scope: InstallScope;
  method: InstallMethod;
  path: string;
  installedAt: string;
}
