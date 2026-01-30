import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { AITool, InstallScope } from "../types.js";
import { ALL_TOOLS, AI_TOOLS } from "../config/tools.js";
import { parseToolsArg } from "../utils/detection.js";
import { promptConfirm } from "../utils/prompts.js";
import { uninstallSkill, getInstalledSkills } from "../handlers/skill.js";
import { handleCommandError } from "../utils/errors.js";

async function findInstalledTools(
  name: string,
  scope: InstallScope
): Promise<AITool[]> {
  const tools: AITool[] = [];
  for (const tool of ALL_TOOLS) {
    const installed = await getInstalledSkills(tool, scope);
    if (installed.includes(name)) {
      tools.push(tool);
    }
  }
  return tools;
}

async function removeFromTools(
  name: string,
  tools: AITool[],
  scope: InstallScope
): Promise<number> {
  let successCount = 0;
  for (const tool of tools) {
    const spinner = ora(`Removing from ${AI_TOOLS[tool].name}...`).start();

    const removed = await uninstallSkill(name, tool, scope);
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
  .description("Remove an installed skill")
  .argument("<name>", "Name of the skill to remove")
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

      // Determine which tools to uninstall from
      const tools = options.agents
        ? parseToolsArg(options.agents, ALL_TOOLS)
        : await findInstalledTools(name, scope);

      if (tools.length === 0) {
        console.log(
          chalk.yellow(`Skill "${name}" is not installed in ${scope} scope`)
        );
        process.exit(0);
      }

      // Confirm
      if (!options.yes) {
        console.log(chalk.cyan("\nWill remove from:"));
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
      const successCount = await removeFromTools(name, tools, scope);

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
