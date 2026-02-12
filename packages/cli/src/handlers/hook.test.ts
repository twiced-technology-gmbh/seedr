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
  getItemSourcePath: vi.fn((item: RegistryItem) => `/registry/${item.type}s/${item.slug}`),
  fetchItemToDestination: vi.fn(),
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
      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "lint-hook",
        name: "Lint Hook",
        type: "hook",
        description: "Pre-commit lint hook",
        compatibility: ["claude"],
        contents: {
          files: [{ name: "lint-hook.sh", type: "file" }],
          triggers: [{ event: "PreCommit" }],
        },
      };

      // Create existing settings file and script source
      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync("/my/project/.claude/settings.json", JSON.stringify({ existing: true }));
      vol.mkdirSync("/registry/hooks/lint-hook", { recursive: true });
      vol.writeFileSync("/registry/hooks/lint-hook/lint-hook.sh", "#!/bin/bash\npnpm lint");

      const results = await installHook(item, ["claude"], "project", "copy", "/my/project");

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.existing).toBe(true);
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreCommit).toEqual([{ hooks: [{ type: "command", command: ".claude/hooks/lint-hook.sh" }] }]);
    });

    it("should append to existing hooks array with same matcher", async () => {
      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "test-hook",
        name: "Test Hook",
        type: "hook",
        description: "Pre-commit test hook",
        compatibility: ["claude"],
        contents: {
          files: [{ name: "test-hook.sh", type: "file" }],
          triggers: [{ event: "PreCommit" }],
        },
      };

      // Create settings with existing hook entry (same event, no matcher) and script source
      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync(
        "/my/project/.claude/settings.json",
        JSON.stringify({
          hooks: {
            PreCommit: [{ hooks: [{ type: "command", command: "pnpm lint" }] }],
          },
        })
      );
      vol.mkdirSync("/registry/hooks/test-hook", { recursive: true });
      vol.writeFileSync("/registry/hooks/test-hook/test-hook.sh", "#!/bin/bash\npnpm test");

      await installHook(item, ["claude"], "project", "copy", "/my/project");

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      // Same matcher (undefined) — appends to existing entry's hooks array
      expect(settings.hooks.PreCommit).toHaveLength(1);
      expect(settings.hooks.PreCommit[0].hooks).toHaveLength(2);
      expect(settings.hooks.PreCommit[0].hooks[0]).toEqual({ type: "command", command: "pnpm lint" });
      expect(settings.hooks.PreCommit[0].hooks[1]).toEqual({ type: "command", command: ".claude/hooks/test-hook.sh" });
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
      const { installHook } = await import("./hook.js");

      const item: RegistryItem = {
        slug: "ts-check-hook",
        name: "TS Check Hook",
        type: "hook",
        description: "TypeScript check hook",
        compatibility: ["claude"],
        contents: {
          files: [{ name: "ts-check-hook.sh", type: "file" }],
          triggers: [{ event: "PreCommit", matcher: "*.ts" }],
        },
      };

      vol.mkdirSync("/my/project/.claude", { recursive: true });
      vol.writeFileSync("/my/project/.claude/settings.json", "{}");
      vol.mkdirSync("/registry/hooks/ts-check-hook", { recursive: true });
      vol.writeFileSync("/registry/hooks/ts-check-hook/ts-check-hook.sh", "#!/bin/bash\ntsc --noEmit");

      await installHook(item, ["claude"], "project", "copy", "/my/project");

      const settings = JSON.parse(vol.readFileSync("/my/project/.claude/settings.json", "utf-8") as string);
      expect(settings.hooks.PreCommit).toBeDefined();
      expect(settings.hooks.PreCommit[0].matcher).toBe("*.ts");
      expect(settings.hooks.PreCommit[0].hooks[0].command).toBe(".claude/hooks/ts-check-hook.sh");
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
