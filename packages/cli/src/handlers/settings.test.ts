import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { vol } from "memfs";
import type { RegistryItem } from "@seedr/shared";

// Mock fs/promises with memfs
vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");
  return memfs.fs.promises;
});

// Mock the registry module
vi.mock("../config/registry.js", () => ({
  getItemContent: vi.fn(),
}));

// Mock homedir
vi.mock("node:os", () => ({
  homedir: () => "/home/testuser",
}));

describe("settings handler", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe("installSettings", () => {
    it("should merge settings into settings.json", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          theme: "dark",
          fontSize: 14,
        })
      );

      const { installSettings } = await import("./settings.js");

      const item: RegistryItem = {
        slug: "dark-theme",
        name: "Dark Theme Settings",
        type: "settings",
        description: "Dark theme configuration",
        compatibility: ["claude"],
      };

      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync("/my/project/.claude/settings.json", JSON.stringify({ existing: true }));

      const results = await installSettings(item, ["claude"], "project", "copy", "/my/project");

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.existing).toBe(true);
      expect(settings.theme).toBe("dark");
      expect(settings.fontSize).toBe(14);
    });

    it("should deep merge nested settings", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          editor: {
            tabSize: 2,
          },
        })
      );

      const { installSettings } = await import("./settings.js");

      const item: RegistryItem = {
        slug: "editor-settings",
        name: "Editor Settings",
        type: "settings",
        description: "Editor configuration",
        compatibility: ["claude"],
      };

      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync(
        "/my/project/.claude/settings.json",
        JSON.stringify({
          editor: {
            lineNumbers: true,
          },
        })
      );

      await installSettings(item, ["claude"], "project", "copy", "/my/project");

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.editor.lineNumbers).toBe(true);
      expect(settings.editor.tabSize).toBe(2);
    });

    it("should fail for non-claude tools", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(JSON.stringify({ theme: "dark" }));

      const { installSettings } = await import("./settings.js");

      const item: RegistryItem = {
        slug: "settings",
        name: "Settings",
        type: "settings",
        description: "Settings",
        compatibility: ["claude"],
      };

      const results = await installSettings(item, ["copilot"], "project", "copy", "/my/project");

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain("only supported for Claude");
    });

    it("should use local scope path correctly", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(JSON.stringify({ local: true }));

      const { installSettings } = await import("./settings.js");

      const item: RegistryItem = {
        slug: "local-settings",
        name: "Local Settings",
        type: "settings",
        description: "Local settings",
        compatibility: ["claude"],
      };

      const results = await installSettings(item, ["claude"], "local", "copy", "/my/project");

      expect(results[0]?.success).toBe(true);
      expect(results[0]?.path).toBe("/my/project/.claude/settings.local.json");
    });
  });

  describe("settingsHandler", () => {
    it("should implement ContentHandler interface", async () => {
      const { settingsHandler } = await import("./settings.js");

      expect(settingsHandler.type).toBe("settings");
      expect(typeof settingsHandler.install).toBe("function");
      expect(typeof settingsHandler.uninstall).toBe("function");
      expect(typeof settingsHandler.listInstalled).toBe("function");
    });
  });
});
