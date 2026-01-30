import { Command } from "commander";
import chalk from "chalk";
import type { ComponentType } from "../types.js";
import { listItems } from "../config/registry.js";
import { ALL_TOOLS, AI_TOOLS } from "../config/tools.js";
import { getInstalledSkills } from "../handlers/skill.js";
import { handleCommandError } from "../utils/errors.js";

// Display constants
const SEPARATOR_WIDTH = 40;
const SLUG_COLUMN_WIDTH = 24;

// Type-to-color mapping for consistent styling
const TYPE_COLORS: Record<ComponentType, (s: string) => string> = {
  skill: chalk.magenta,
  hook: chalk.hex("#a855f7"),
  agent: chalk.blue,
  plugin: chalk.hex("#6366f1"),
  command: chalk.hex("#f59e0b"),
  settings: chalk.hex("#f97316"),
  mcp: chalk.hex("#2dd4bf"),
};

export const listCommand = new Command("list")
  .alias("ls")
  .description("List available or installed skills")
  .option("-t, --type <type>", "Filter by type (skill, hook, agent, plugin)")
  .option("-i, --installed", "Show only installed items")
  .option("--scope <scope>", "Scope for installed check (project, user, global)", "project")
  .action(async (options) => {
    try {
      if (options.installed) {
        await listInstalled(options.scope);
      } else {
        await listAvailable(options.type as ComponentType | undefined);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });

async function listAvailable(type?: ComponentType): Promise<void> {
  const items = await listItems(type);

  if (items.length === 0) {
    console.log(chalk.yellow("No items found in registry"));
    return;
  }

  // Group by type
  const grouped = groupByType(items);

  for (const [itemType, typeItems] of Object.entries(grouped)) {
    const colorFn = TYPE_COLORS[itemType as ComponentType] ?? chalk.white;
    console.log(colorFn(`\n${itemType.toUpperCase()}S`));
    console.log(chalk.gray("─".repeat(SEPARATOR_WIDTH)));

    for (const item of typeItems) {
      const compatIcons = item.compatibility
        .map((t) => AI_TOOLS[t].shortName)
        .join(" ");
      const featured = item.featured ? chalk.yellow("★ ") : "  ";
      console.log(
        `${featured}${chalk.white(item.slug.padEnd(SLUG_COLUMN_WIDTH))} ${chalk.gray(compatIcons)}`
      );
      console.log(`   ${chalk.gray(item.description)}`);
    }
  }

  console.log("");
  console.log(
    chalk.gray(`Total: ${items.length} items. Use 'seedr add <name>' to install.`)
  );
}

async function listInstalled(scope: string): Promise<void> {
  console.log(chalk.cyan(`\nInstalled skills (${scope} scope):\n`));

  let total = 0;
  for (const tool of ALL_TOOLS) {
    const installed = await getInstalledSkills(
      tool,
      scope as "project" | "user" | "global"
    );

    if (installed.length > 0) {
      console.log(chalk.blue(AI_TOOLS[tool].name));
      for (const skill of installed) {
        console.log(`  ${chalk.white(skill)}`);
        total++;
      }
      console.log("");
    }
  }

  if (total === 0) {
    console.log(chalk.yellow("No skills installed"));
  } else {
    console.log(chalk.gray(`Total: ${total} installed`));
  }
}

/** Group items by their type */
function groupByType<T extends { type: ComponentType }>(
  items: T[]
): Record<ComponentType, T[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<ComponentType, T[]>
  );
}
