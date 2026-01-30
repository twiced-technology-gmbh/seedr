/**
 * Skill conversion utilities.
 *
 * This module re-exports from the converters module for backward compatibility.
 * New code should import directly from "../converters/index.js".
 */

import type { AITool } from "../types.js";
import { AI_TOOLS } from "../config/tools.js";

// Re-export converter functions for backward compatibility
export {
  parseSkillMarkdown,
  convertSkillToTool,
  getConverter,
  hasConverter,
} from "../converters/index.js";

// Re-export types
export type {
  SkillConverter,
  ParsedSkill,
  SkillFrontmatter,
} from "../converters/index.js";

/**
 * Get the output filename for a skill in a specific tool format.
 */
export function getOutputFilename(slug: string, tool: AITool): string {
  const config = AI_TOOLS[tool];
  return `${slug}${config.skillExtension}`;
}
