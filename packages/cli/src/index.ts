// Public API exports
export type {
  AITool,
  ComponentType,
  InstallScope,
  InstallMethod,
  AIToolConfig,
  RegistryItem,
  RegistryManifest,
  InstallOptions,
  InstalledItem,
} from "./types.js";

export { AI_TOOLS, ALL_TOOLS, getToolConfig, getToolPath } from "./config/tools.js";
export {
  loadManifest,
  getItem,
  listItems,
  searchItems,
  getItemContent,
} from "./config/registry.js";

export { installSkill, uninstallSkill, getInstalledSkills } from "./handlers/skill.js";
export { convertSkillToTool, parseSkillMarkdown } from "./utils/convert.js";
export { detectInstalledTools, detectProjectTools, isToolInstalled } from "./utils/detection.js";
