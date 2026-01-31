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

describe("hook handler", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe("installHook", () => {
    it("should merge hook into settings.json", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          event: "PreCommit",
          hooks: [{ type: "command", command: "pnpm lint" }],
        })
      );

      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "lint-hook",
        name: "Lint Hook",
        type: "hook",
        description: "Pre-commit lint hook",
        compatibility: ["claude"],
      };

      // Create existing settings file
      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync("/my/project/.claude/settings.json", JSON.stringify({ existing: true }));

      const results = await installHook(item, ["claude"], "project", "copy", "/my/project");

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.existing).toBe(true);
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreCommit).toEqual([{ type: "command", command: "pnpm lint" }]);
    });

    it("should append to existing hooks array", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          event: "PreCommit",
          hooks: [{ type: "command", command: "pnpm test" }],
        })
      );

      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "test-hook",
        name: "Test Hook",
        type: "hook",
        description: "Pre-commit test hook",
        compatibility: ["claude"],
      };

      // Create settings with existing hook
      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync(
        "/my/project/.claude/settings.json",
        JSON.stringify({
          hooks: {
            PreCommit: [{ type: "command", command: "pnpm lint" }],
          },
        })
      );

      await installHook(item, ["claude"], "project", "copy", "/my/project");

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.hooks.PreCommit).toHaveLength(2);
      expect(settings.hooks.PreCommit[0]).toEqual({ type: "command", command: "pnpm lint" });
      expect(settings.hooks.PreCommit[1]).toEqual({ type: "command", command: "pnpm test" });
    });

    it("should fail for non-claude tools", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          event: "PreCommit",
          hooks: [{ type: "command", command: "pnpm lint" }],
        })
      );

      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "lint-hook",
        name: "Lint Hook",
        type: "hook",
        description: "Pre-commit lint hook",
        compatibility: ["claude"],
      };

      const results = await installHook(item, ["copilot"], "project", "copy", "/my/project");

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain("only supported for Claude");
    });

    it("should use hook key with matcher when provided", async () => {
      const { getItemContent } = await import("../config/registry.js");
      vi.mocked(getItemContent).mockResolvedValue(
        JSON.stringify({
          event: "PreCommit",
          matcher: "*.ts",
          hooks: [{ type: "command", command: "tsc --noEmit" }],
        })
      );

      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "ts-check-hook",
        name: "TS Check Hook",
        type: "hook",
        description: "TypeScript check hook",
        compatibility: ["claude"],
      };

      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync("/my/project/.claude/settings.json", "{}");

      await installHook(item, ["claude"], "project", "copy", "/my/project");

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.hooks["PreCommit:*.ts"]).toBeDefined();
    });
  });

  describe("hookHandler", () => {
    it("should implement ContentHandler interface", async () => {
      const { hookHandler } = await import("./hook.js");

      expect(hookHandler.type).toBe("hook");
      expect(typeof hookHandler.install).toBe("function");
      expect(typeof hookHandler.uninstall).toBe("function");
      expect(typeof hookHandler.listInstalled).toBe("function");
    });
  });
});
