/**
 * Skill conversion utilities.
 *
 * This module re-exports from the converters module for backward compatibility.
 * New code should import directly from "../converters/index.js".
 *
 * Note: With the new unified skill format (all tools use directory structure
 * with SKILL.md), conversion is largely unnecessary. These functions are
 * kept for backward compatibility.
 */

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
