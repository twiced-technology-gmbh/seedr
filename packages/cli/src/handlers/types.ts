import type { AITool, InstallScope, InstallMethod } from "../types.js";
import type { ComponentType, RegistryItem } from "@seedr/shared";

export interface InstallResult {
  tool: AITool;
  success: boolean;
  path: string;
  error?: string;
}

export interface ContentHandler {
  readonly type: ComponentType;

  /**
   * Install content for the specified tools.
   */
  install(
    item: RegistryItem,
    tools: AITool[],
    scope: InstallScope,
    method: InstallMethod,
    cwd?: string
  ): Promise<InstallResult[]>;

  /**
   * Uninstall content for a specific tool.
   */
  uninstall(
    slug: string,
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<boolean>;

  /**
   * List installed content for a specific tool.
   */
  listInstalled(
    tool: AITool,
    scope: InstallScope,
    cwd?: string
  ): Promise<string[]>;
}
