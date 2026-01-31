import { describe, it, expect } from "vitest";
import {
  TOOL_COMPATIBILITY,
  isTypeSupported,
  getCompatibleTools,
  filterCompatibleTools,
} from "./compatibility.js";

describe("compatibility", () => {
  describe("TOOL_COMPATIBILITY", () => {
    it("should have all content types defined", () => {
      expect(TOOL_COMPATIBILITY).toHaveProperty("skill");
      expect(TOOL_COMPATIBILITY).toHaveProperty("command");
      expect(TOOL_COMPATIBILITY).toHaveProperty("agent");
      expect(TOOL_COMPATIBILITY).toHaveProperty("hook");
      expect(TOOL_COMPATIBILITY).toHaveProperty("plugin");
      expect(TOOL_COMPATIBILITY).toHaveProperty("settings");
      expect(TOOL_COMPATIBILITY).toHaveProperty("mcp");
    });

    it("should have skills compatible with all tools", () => {
      expect(TOOL_COMPATIBILITY.skill).toContain("claude");
      expect(TOOL_COMPATIBILITY.skill).toContain("copilot");
      expect(TOOL_COMPATIBILITY.skill).toContain("gemini");
      expect(TOOL_COMPATIBILITY.skill).toContain("codex");
      expect(TOOL_COMPATIBILITY.skill).toContain("opencode");
    });

    it("should have Claude-only types", () => {
      expect(TOOL_COMPATIBILITY.agent).toEqual(["claude"]);
      expect(TOOL_COMPATIBILITY.hook).toEqual(["claude"]);
      expect(TOOL_COMPATIBILITY.plugin).toEqual(["claude"]);
      expect(TOOL_COMPATIBILITY.settings).toEqual(["claude"]);
      expect(TOOL_COMPATIBILITY.command).toEqual(["claude"]);
    });

    it("should have MCP compatible with all tools", () => {
      expect(TOOL_COMPATIBILITY.mcp).toContain("claude");
      expect(TOOL_COMPATIBILITY.mcp).toContain("copilot");
    });
  });

  describe("isTypeSupported", () => {
    it("should return true for supported type/tool combinations", () => {
      expect(isTypeSupported("skill", "claude")).toBe(true);
      expect(isTypeSupported("skill", "copilot")).toBe(true);
      expect(isTypeSupported("agent", "claude")).toBe(true);
    });

    it("should return false for unsupported type/tool combinations", () => {
      expect(isTypeSupported("agent", "copilot")).toBe(false);
      expect(isTypeSupported("hook", "gemini")).toBe(false);
      expect(isTypeSupported("plugin", "codex")).toBe(false);
    });
  });

  describe("getCompatibleTools", () => {
    it("should return all tools for skills", () => {
      const tools = getCompatibleTools("skill");
      expect(tools).toHaveLength(5);
      expect(tools).toContain("claude");
      expect(tools).toContain("copilot");
    });

    it("should return only claude for agents", () => {
      const tools = getCompatibleTools("agent");
      expect(tools).toEqual(["claude"]);
    });
  });

  describe("filterCompatibleTools", () => {
    it("should filter tools to only compatible ones", () => {
      const tools = filterCompatibleTools("agent", ["claude", "copilot", "gemini"]);
      expect(tools).toEqual(["claude"]);
    });

    it("should return all tools if all are compatible", () => {
      const tools = filterCompatibleTools("skill", ["claude", "copilot"]);
      expect(tools).toEqual(["claude", "copilot"]);
    });

    it("should return empty array if no tools are compatible", () => {
      const tools = filterCompatibleTools("agent", ["copilot", "gemini"]);
      expect(tools).toEqual([]);
    });
  });
});
