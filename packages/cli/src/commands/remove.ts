import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope } from "../types.js";
import type { ComponentType } from "@seedr/shared";
import { ALL_TOOLS, AI_TOOLS } from "../config/tools.js";
import { parseToolsArg } from "../utils/detection.js";
import { promptConfirm } from "../utils/prompts.js";
import { getHandler } from "../handlers/registry.js";
import { handleCommandError } from "../utils/errors.js";

// Ensure handlers are registered
import "../handlers/index.js";

async function findInstalledTools(
  slug: string,
  type: ComponentType,
  scope: InstallScope
): Promise<AITool[]> {
  const handler = getHandler(type);
  if (!handler) return [];

  const tools: AITool[] = [];
  for (const tool of ALL_TOOLS) {
    const installed = await handler.listInstalled(tool, scope);
    if (installed.includes(slug)) {
      tools.push(tool);
    }
  }
  return tools;
}

async function removeFromTools(
  slug: string,
  type: ComponentType,
  tools: AITool[],
  scope: InstallScope
): Promise<number> {
  const handler = getHandler(type);
  if (!handler) return 0;

  let successCount = 0;
  for (const tool of tools) {
    const spinner = ora(`Removing from ${AI_TOOLS[tool].name}...`).start();

    const removed = await handler.uninstall(slug, tool, scope);
    if (removed) {
      spinner.succeed(chalk.green(`Removed from ${AI_TOOLS[tool].name}`));
      successCount++;
    } else {
      spinner.info(chalk.gray(`Not found in ${AI_TOOLS[tool].name}`));
    }
  }
  return successCount;
}

export const removeCommand = new Command("remove")
  .alias("rm")
  .description("Remove an installed item (skill, plugin, agent, hook, mcp)")
  .argument("<name>", "Name/slug of the item to remove")
  .option("-t, --type <type>", "Content type: skill, agent, hook, mcp, plugin, settings")
  .option(
    "-a, --agents <tools>",
    "Comma-separated AI tools or 'all'"
  )
  .option(
    "--scope <scope>",
    "Installation scope: project, user, or global",
    "project"
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (name, options) => {
    try {
      const scope: InstallScope = options.scope;
      const type: ComponentType | undefined = options.type;

      if (!type) {
        console.log(
          chalk.yellow(`Please specify the content type with --type (skill, plugin, agent, hook, mcp, settings)`)
        );
        process.exit(1);
      }

      const handler = getHandler(type);
      if (!handler) {
        console.log(chalk.red(`No handler found for type "${type}"`));
        process.exit(1);
      }

      // Determine which tools to uninstall from
      const tools = options.agents
        ? parseToolsArg(options.agents, ALL_TOOLS)
        : await findInstalledTools(name, type, scope);

      if (tools.length === 0) {
        console.log(
          chalk.yellow(`${type} "${name}" is not installed in ${scope} scope`)
        );
        process.exit(0);
      }

      // Confirm
      if (!options.yes) {
        console.log(chalk.cyan(`\nWill remove ${type} "${name}" from:`));
        for (const tool of tools) {
          console.log(`  - ${AI_TOOLS[tool].name}`);
        }
        console.log("");

        const confirmed = await promptConfirm("Proceed with removal?");
        if (!confirmed) {
          console.log(chalk.yellow("Removal cancelled"));
          process.exit(0);
        }
      }

      // Remove and report
      const successCount = await removeFromTools(name, type, tools, scope);

      console.log("");
      if (successCount > 0) {
        console.log(
          chalk.green(`Successfully removed from ${successCount} tool(s)`)
        );
      } else {
        console.log(chalk.yellow("Nothing to remove"));
      }
    } catch (error) {
      handleCommandError(error);
    }
  });
