import { Command } from "commander";
import chalk from "chalk";
import type { AITool, InstallScope, InstallMethod, RegistryItem } from "../types.js";
import type { ComponentType } from "@seedr/shared";
import { listItems, getItem, searchItems } from "../config/registry.js";
import { parseToolsArg } from "../utils/detection.js";
import * as ui from "../utils/ui.js";
import { getHandler } from "../handlers/registry.js";
import type { InstallResult } from "../handlers/types.js";
import { handleCommandError } from "../utils/errors.js";
import { trackInstalls } from "../utils/analytics.js";
import { AI_TOOLS, getContentPath } from "../config/tools.js";
import { filterCompatibleTools } from "../config/compatibility.js";
import { getAgentsPath } from "../utils/fs.js";

// Ensure handlers are registered
import "../handlers/index.js";

async function resolveItem(
  itemName: string | undefined,
  type: ComponentType | undefined
): Promise<RegistryItem | null> {
  if (itemName) {
    const item = await getItem(itemName, type);
    if (item) return item;

    const results = await searchItems(itemName);
    const filtered = type ? results.filter((r) => r.type === type) : results;

    if (filtered.length === 0) {
      ui.error(`"${itemName}" not found`);
      return null;
    }
    if (filtered.length === 1) {
      return filtered[0]!;
    }
    ui.warn(`Multiple matches for "${itemName}"`);
    const selected = await ui.selectSkill(filtered);
    if (ui.prompts.isCancel(selected)) {
      ui.cancelled();
      return null;
    }
    return selected as RegistryItem;
  }

  // No name provided - list items of the specified type (or all skills)
  const items = await listItems(type || "skill");
  if (items.length === 0) {
    ui.error(`No ${type || "skill"}s available in registry`);
    return null;
  }
  const selected = await ui.selectSkill(items);
  if (ui.prompts.isCancel(selected)) {
    ui.cancelled();
    return null;
  }
  return selected as RegistryItem;
}

function resolveTools(
  agentsArg: string | undefined,
  item: RegistryItem
): AITool[] {
  // Filter tools by both item compatibility and type compatibility
  const typeCompatible = filterCompatibleTools(item.type, item.compatibility);

  if (!agentsArg) return [];

  const tools = parseToolsArg(agentsArg, typeCompatible);

  if (agentsArg === "all") return tools;

  const incompatible = tools.filter((t) => !typeCompatible.includes(t));
  if (incompatible.length > 0) {
    ui.warn(`${incompatible.join(", ")} not compatible with this ${item.type}`);
    return tools.filter((t) => typeCompatible.includes(t));
  }
  return tools;
}

function printDryRunSummary(
  item: RegistryItem,
  tools: AITool[],
  scope: InstallScope,
  method: InstallMethod,
  cwd: string
): void {
  ui.info("Dry run - no files will be written\n");

  console.log(chalk.cyan("  Would install:"));
  console.log(`    ${item.type}: ${chalk.white(item.name)}`);
  console.log(`    Scope: ${chalk.white(scope)}`);
  console.log(`    Method: ${chalk.white(method)}`);
  console.log();

  // Show central location for symlink method
  if (method === "symlink" && item.type === "skill") {
    const centralPath = getAgentsPath("skill", item.slug, cwd);
    console.log(chalk.cyan("  Central storage:"));
    console.log(`    ${chalk.gray("→")} ${chalk.gray(centralPath)}`);
    console.log();
    console.log(chalk.cyan("  Symlinks from tool folders:"));
  } else {
    console.log(chalk.cyan("  Target locations:"));
  }

  for (const tool of tools) {
    const config = AI_TOOLS[tool];
    const contentPath = getContentPath(tool, item.type, scope, cwd);
    if (!contentPath) {
      console.log(`    ${chalk.gray("→")} ${chalk.white(config.name)}: ${chalk.red("not supported")}`);
      continue;
    }

    const targetPath = `${contentPath}/${item.slug}`;
    console.log(`    ${chalk.gray("→")} ${chalk.white(config.name)}: ${chalk.gray(targetPath)}`);
  }
  console.log();
}

function printInstallSummary(results: InstallResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    ui.success(`Installed for ${successful.length} tool(s)`);
    for (const r of successful) {
      console.log(chalk.gray(`    → ${r.path}`));
    }
  }

  if (failed.length > 0) {
    ui.error(`Failed for ${failed.length} tool(s)`);
    for (const r of failed) {
      console.log(chalk.red(`    × ${r.tool}: ${r.error}`));
    }
    process.exit(1);
  }
}

export const addCommand = new Command("add")
  .description("Install a skill, agent, hook, or other configuration")
  .argument("[name]", "Name of the item to install")
  .option("-t, --type <type>", "Content type: skill, agent, hook, mcp, plugin, settings")
  .option(
    "-a, --agents <tools>",
    "Comma-separated AI tools or 'all' (claude,copilot,gemini,codex,opencode)"
  )
  .option("-s, --scope <scope>", "Installation scope: project, user, or local")
  .option("-m, --method <method>", "Installation method: symlink or copy")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Show what would be installed without making changes")
  .action(async (name, options) => {
    try {
      ui.printLogo();
      ui.intro("Seedr");

      const itemName = name;
      const contentType = options.type as ComponentType | undefined;

      // Step 1: Get or prompt for item
      const item = await resolveItem(itemName, contentType);
      if (!item) process.exit(1);

      ui.step(`Selected: ${chalk.cyan(item.name)} ${chalk.gray(`(${item.type})`)} ${chalk.gray(`- ${item.description}`)}`);

      // Verify handler exists for this type
      const handler = getHandler(item.type);
      if (!handler) {
        ui.error(`No handler found for type "${item.type}"`);
        process.exit(1);
      }

      // Step 2: Get or prompt for tools
      const typeCompatible = filterCompatibleTools(item.type, item.compatibility);
      let tools = resolveTools(options.agents, item);

      if (tools.length === 0) {
        if (typeCompatible.length === 1) {
          // Only one compatible tool, use it directly
          tools = typeCompatible;
        } else {
          const selected = await ui.selectTools(typeCompatible);
          if (ui.prompts.isCancel(selected)) {
            ui.cancelled();
            return;
          }
          tools = selected as AITool[];
        }
      }

      if (tools.length === 0) {
        ui.error("No valid tools selected");
        process.exit(1);
      }

      ui.step(`Tools: ${chalk.cyan(tools.join(", "))}`);

      // Step 3: Get or prompt for scope
      let scope: InstallScope;
      if (options.scope) {
        scope = options.scope;
      } else {
        const supportsLocal = ["plugin", "settings", "hook"].includes(item.type);
        const selected = await ui.selectScope(supportsLocal);
        if (ui.prompts.isCancel(selected)) {
          ui.cancelled();
          return;
        }
        scope = selected as InstallScope;
      }

      ui.step(`Scope: ${chalk.cyan(scope)}`);

      // Step 4: Get or prompt for method (only if multiple tools selected)
      let method: InstallMethod;
      if (options.method) {
        method = options.method;
      } else if (tools.length === 1) {
        // Single tool - always use copy (symlink only makes sense for shared central storage)
        method = "copy";
      } else {
        const symlinkPath = getAgentsPath(item.type, item.slug, process.cwd());
        const selected = await ui.selectMethod(symlinkPath);
        if (ui.prompts.isCancel(selected)) {
          ui.cancelled();
          return;
        }
        method = selected as InstallMethod;
      }

      ui.step(`Method: ${chalk.cyan(method)}`);

      // Dry run: show what would happen and exit
      if (options.dryRun) {
        console.log();
        printDryRunSummary(item, tools, scope, method, process.cwd());
        ui.outro("Dry run complete");
        return;
      }

      // Step 5: Confirm
      if (!options.yes) {
        console.log();
        const confirmed = await ui.confirm("Proceed with installation?");
        if (ui.prompts.isCancel(confirmed) || !confirmed) {
          ui.cancelled();
          return;
        }
      }

      // Step 6: Install using the handler and print summary
      console.log();
      const results = await handler.install(item, tools, scope, method, process.cwd());
      trackInstalls(item.slug, item.type, results, scope);
      printInstallSummary(results);

      ui.outro("Installation complete");
    } catch (error) {
      handleCommandError(error);
    }
  });
