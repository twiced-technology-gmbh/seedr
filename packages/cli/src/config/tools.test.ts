import { describe, it, expect, vi } from "vitest";
import {
  AI_TOOLS,
  ALL_TOOLS,
  getToolConfig,
  getContentTypeConfig,
  getToolRoot,
  getContentPath,
  getSettingsPath,
  getMcpPath,
} from "./tools.js";

// Mock homedir to return a consistent path for testing
vi.mock("node:os", () => ({
  homedir: () => "/home/testuser",
}));

describe("tools", () => {
  describe("AI_TOOLS", () => {
    it("should have all 5 tools defined", () => {
      expect(Object.keys(AI_TOOLS)).toHaveLength(5);
      expect(AI_TOOLS).toHaveProperty("claude");
      expect(AI_TOOLS).toHaveProperty("copilot");
      expect(AI_TOOLS).toHaveProperty("gemini");
      expect(AI_TOOLS).toHaveProperty("codex");
      expect(AI_TOOLS).toHaveProperty("opencode");
    });

    it("should have correct structure for claude", () => {
      const claude = AI_TOOLS.claude;
      expect(claude.name).toBe("Claude Code");
      expect(claude.shortName).toBe("claude");
      expect(claude.projectRoot).toBe(".claude");
      expect(claude.contentTypes).toHaveProperty("skill");
      expect(claude.contentTypes).toHaveProperty("agent");
      expect(claude.contentTypes).toHaveProperty("hook");
      expect(claude.contentTypes).toHaveProperty("mcp");
    });

    it("should have directory structure for skills in all tools", () => {
      for (const tool of ALL_TOOLS) {
        const skillConfig = AI_TOOLS[tool].contentTypes.skill;
        expect(skillConfig).toBeDefined();
        expect(skillConfig?.structure).toBe("directory");
        expect(skillConfig?.mainFile).toBe("SKILL.md");
        expect(skillConfig?.path).toBe("skills");
      }
    });
  });

  describe("getToolConfig", () => {
    it("should return config for a valid tool", () => {
      const config = getToolConfig("claude");
      expect(config.name).toBe("Claude Code");
    });
  });

  describe("getContentTypeConfig", () => {
    it("should return config for supported type", () => {
      const config = getContentTypeConfig("claude", "skill");
      expect(config).toBeDefined();
      expect(config?.structure).toBe("directory");
    });

    it("should return undefined for unsupported type", () => {
      const config = getContentTypeConfig("copilot", "agent");
      expect(config).toBeUndefined();
    });

    it("should return json-merge for hooks", () => {
      const config = getContentTypeConfig("claude", "hook");
      expect(config?.structure).toBe("json-merge");
      expect(config?.mergeTarget).toBe("settings.json");
      expect(config?.mergeField).toBe("hooks");
    });
  });

  describe("getToolRoot", () => {
    it("should return project root for project scope", () => {
      const root = getToolRoot("claude", "project", "/my/project");
      expect(root).toBe("/my/project/.claude");
    });

    it("should return user root for user scope", () => {
      const root = getToolRoot("claude", "user", "/my/project");
      expect(root).toContain(".claude");
    });

    it("should return project root for local scope", () => {
      const root = getToolRoot("claude", "local", "/my/project");
      expect(root).toBe("/my/project/.claude");
    });

    it("should use correct project root for each tool", () => {
      expect(getToolRoot("copilot", "project", "/project")).toBe("/project/.github");
      expect(getToolRoot("gemini", "project", "/project")).toBe("/project/.gemini");
      expect(getToolRoot("codex", "project", "/project")).toBe("/project/.codex");
      expect(getToolRoot("opencode", "project", "/project")).toBe("/project/.opencode");
    });
  });

  describe("getContentPath", () => {
    it("should return correct path for skills", () => {
      const path = getContentPath("claude", "skill", "project", "/my/project");
      expect(path).toBe("/my/project/.claude/skills");
    });

    it("should return correct path for agents", () => {
      const path = getContentPath("claude", "agent", "project", "/my/project");
      expect(path).toBe("/my/project/.claude/agents");
    });

    it("should return undefined for unsupported content types", () => {
      const path = getContentPath("copilot", "agent", "project", "/my/project");
      expect(path).toBeUndefined();
    });

    it("should return root for types with empty path", () => {
      const path = getContentPath("claude", "hook", "project", "/my/project");
      expect(path).toBe("/my/project/.claude");
    });
  });

  describe("getSettingsPath", () => {
    it("should return project settings path", () => {
      const path = getSettingsPath("project", "/my/project");
      expect(path).toBe("/my/project/.claude/settings.json");
    });

    it("should return local settings path", () => {
      const path = getSettingsPath("local", "/my/project");
      expect(path).toBe("/my/project/.claude/settings.local.json");
    });
  });

  describe("getMcpPath", () => {
    it("should return project .mcp.json for project scope", () => {
      const path = getMcpPath("project", "/my/project");
      expect(path).toBe("/my/project/.mcp.json");
    });

    it("should return project .mcp.json for local scope", () => {
      const path = getMcpPath("local", "/my/project");
      expect(path).toBe("/my/project/.mcp.json");
    });
  });
});
