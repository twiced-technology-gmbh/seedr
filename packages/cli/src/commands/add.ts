import { Command } from "commander";
import chalk from "chalk";
import type { AITool, InstallScope, InstallMethod, RegistryItem } from "../types.js";
import { listItems, getItem, searchItems } from "../config/registry.js";
import { parseToolsArg } from "../utils/detection.js";
import {
  promptSkillSelection,
  promptToolSelection,
  promptScope,
  promptMethod,
  promptConfirm,
} from "../utils/prompts.js";
import { installSkill } from "../handlers/skill.js";
import type { InstallResult } from "../handlers/skill.js";
import { handleCommandError } from "../utils/errors.js";

async function resolveItem(skillName?: string): Promise<RegistryItem> {
  if (skillName) {
    const item = await getItem(skillName);
    if (item) return item;

    // Try searching
    const results = await searchItems(skillName);
    if (results.length === 0) {
      console.error(chalk.red(`Skill "${skillName}" not found`));
      process.exit(1);
    }
    if (results.length === 1) {
      return results[0]!;
    }
    console.log(chalk.yellow(`Multiple matches for "${skillName}":`));
    return promptSkillSelection(results);
  }

  // Interactive: show all skills
  const skills = await listItems("skill");
  if (skills.length === 0) {
    console.error(chalk.red("No skills available in registry"));
    process.exit(1);
  }
  return promptSkillSelection(skills);
}

function resolveTools(
  agentsArg: string | undefined,
  compatibility: AITool[]
): AITool[] {
  if (!agentsArg) return [];

  const tools = parseToolsArg(agentsArg, compatibility);

  // Validate compatibility if specific tools were requested (not "all")
  if (agentsArg === "all") return tools;

  const incompatible = tools.filter((t) => !compatibility.includes(t));
  if (incompatible.length > 0) {
    console.warn(
      chalk.yellow(
        `Warning: ${incompatible.join(", ")} not compatible with this skill`
      )
    );
    return tools.filter((t) => compatibility.includes(t));
  }
  return tools;
}

function printInstallSummary(results: InstallResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log("");
  if (successful.length > 0) {
    console.log(
      chalk.green(`Successfully installed for ${successful.length} tool(s)`)
    );
    for (const r of successful) {
      console.log(chalk.gray(`  → ${r.path}`));
    }
  }

  if (failed.length > 0) {
    console.log(chalk.red(`Failed for ${failed.length} tool(s)`));
    for (const r of failed) {
      console.log(chalk.red(`  × ${r.tool}: ${r.error}`));
    }
    process.exit(1);
  }
}

export const addCommand = new Command("add")
  .description("Install a skill or configuration")
  .argument("[name]", "Name of the skill to install")
  .option("-s, --skill <name>", "Skill name (alternative to positional arg)")
  .option(
    "-a, --agents <tools>",
    "Comma-separated AI tools or 'all' (claude,copilot,gemini,codex,opencode)"
  )
  .option(
    "--scope <scope>",
    "Installation scope: project, user, or global",
    "project"
  )
  .option(
    "-m, --method <method>",
    "Installation method: symlink or copy",
    "symlink"
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-f, --force", "Overwrite existing files")
  .action(async (name, options) => {
    try {
      const skillName = name ?? options.skill;

      // Step 1: Get or prompt for skill
      const item = await resolveItem(skillName);

      console.log(
        chalk.blue(`\nSelected: ${item.name}`) +
          chalk.gray(` - ${item.description}`)
      );

      // Step 2: Get or prompt for tools
      let tools = resolveTools(options.agents, item.compatibility);
      if (tools.length === 0) {
        tools = await promptToolSelection(item.compatibility);
      }

      if (tools.length === 0) {
        console.error(chalk.red("No valid tools selected"));
        process.exit(1);
      }

      // Step 3: Get or prompt for scope
      const scope: InstallScope = options.scope ?? (await promptScope());

      // Step 4: Get or prompt for method
      const method: InstallMethod = options.method ?? (await promptMethod());

      // Step 5: Confirm
      if (!options.yes) {
        console.log(chalk.cyan("\nInstallation summary:"));
        console.log(`  Skill: ${item.name}`);
        console.log(`  Tools: ${tools.join(", ")}`);
        console.log(`  Scope: ${scope}`);
        console.log(`  Method: ${method}`);
        console.log("");

        const confirmed = await promptConfirm("Proceed with installation?");
        if (!confirmed) {
          console.log(chalk.yellow("Installation cancelled"));
          process.exit(0);
        }
      }

      // Step 6: Install and print summary
      const results = await installSkill(item, tools, scope, method);
      printInstallSummary(results);
    } catch (error) {
      handleCommandError(error);
    }
  });
