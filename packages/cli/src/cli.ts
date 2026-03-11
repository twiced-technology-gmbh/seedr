import { Command } from "commander";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { removeCommand } from "./commands/remove.js";
import { initCommand } from "./commands/init.js";
import { printLogo } from "./utils/ui.js";

const program = new Command();

program
  .name("seedr")
  .description("Seed your projects with capabilities")
  .version("0.1.0")
  .addCommand(addCommand)
  .addCommand(listCommand)
  .addCommand(removeCommand)
  .addCommand(initCommand);

// Default action (no command) - show help
program.action(() => {
  printLogo();
  program.help();
});

program.parse();
