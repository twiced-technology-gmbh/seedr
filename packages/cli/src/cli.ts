import { Command } from "commander";
import chalk from "chalk";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { removeCommand } from "./commands/remove.js";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("seedr")
  .description("Seed your projects with AI configurations")
  .version("0.1.0")
  .addCommand(addCommand)
  .addCommand(listCommand)
  .addCommand(removeCommand)
  .addCommand(initCommand);

// Default action (no command) - show help
program.action(() => {
  console.log(
    chalk.green(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   🌱 seedr                            ║
  ║   Seed your projects with AI configs  ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
`)
  );
  program.help();
});

program.parse();
