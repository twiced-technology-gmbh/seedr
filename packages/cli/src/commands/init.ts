import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join } from "node:path";
import { ALL_TOOLS, AI_TOOLS, getToolPath } from "../config/tools.js";
import { parseToolsArg } from "../utils/detection.js";
import { promptConfirm } from "../utils/prompts.js";
import { ensureDir, exists, writeTextFile } from "../utils/fs.js";
import { handleCommandError } from "../utils/errors.js";

export const initCommand = new Command("init")
  .description("Initialize AI tool configuration directories")
  .option(
    "-a, --agents <tools>",
    "Comma-separated AI tools or 'all'",
    "claude"
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (options) => {
    try {
      // Determine which tools to initialize
      const tools = parseToolsArg(options.agents, ALL_TOOLS);

      if (tools.length === 0) {
        console.error(chalk.red("No valid tools specified"));
        process.exit(1);
      }

      console.log(chalk.cyan("\nWill initialize configuration for:"));
      for (const tool of tools) {
        const path = getToolPath(tool, "project");
        console.log(`  - ${AI_TOOLS[tool].name} → ${path}`);
      }
      console.log("");

      if (!options.yes) {
        const confirmed = await promptConfirm("Proceed?");
        if (!confirmed) {
          console.log(chalk.yellow("Cancelled"));
          process.exit(0);
        }
      }

      for (const tool of tools) {
        const spinner = ora(`Initializing ${AI_TOOLS[tool].name}...`).start();

        const path = getToolPath(tool, "project");

        if (await exists(path)) {
          spinner.info(
            chalk.gray(`${AI_TOOLS[tool].name} already initialized`)
          );
          continue;
        }

        await ensureDir(path);

        // Create a placeholder/readme file
        const readmePath = join(path, "README.md");
        await writeTextFile(
          readmePath,
          `# ${AI_TOOLS[tool].name} Configuration

This directory contains AI configuration files for ${AI_TOOLS[tool].name}.

Add skills with:
\`\`\`bash
npx @toolr/seedr add <skill-name> --agents ${tool}
\`\`\`

Browse available skills at https://seedr.toolr.dev
`
        );

        spinner.succeed(chalk.green(`Initialized ${AI_TOOLS[tool].name}`));
      }

      console.log("");
      console.log(
        chalk.green("Done! Use 'npx @toolr/seedr add <skill>' to install skills.")
      );
    } catch (error) {
      handleCommandError(error);
    }
  });
