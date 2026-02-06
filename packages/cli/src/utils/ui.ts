import * as p from "@clack/prompts";
import chalk from "chalk";
import type { AITool, InstallScope, InstallMethod, RegistryItem } from "../types.js";
import { AI_TOOLS } from "../config/tools.js";

const LOGO = `
███████╗███████╗███████╗██████╗ ██████╗
██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗
███████╗█████╗  █████╗  ██║  ██║██████╔╝
╚════██║██╔══╝  ██╔══╝  ██║  ██║██╔══██╗
███████║███████╗███████╗██████╔╝██║  ██║
╚══════╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝`;

const URLS = {
  toolr: "https://toolr.dev",
  seedr: "https://seedr.toolr.dev",
};

export function printLogo(): void {
  console.log(chalk.cyan(LOGO));
  console.log(chalk.gray(`  ${URLS.seedr}  ·  ${URLS.toolr}`));
  console.log();
}

export function printHeader(text: string): void {
  console.log(chalk.bgCyan.black(` ${text} `));
  console.log();
}

export async function selectSkill(items: RegistryItem[]): Promise<RegistryItem | symbol> {
  const result = await p.select({
    message: "Select a skill to install",
    options: items.map((item) => ({
      label: item.name,
      value: item,
      hint: item.description,
    })),
  });
  return result as RegistryItem | symbol;
}

export async function selectTools(compatible: AITool[]): Promise<AITool[] | symbol> {
  const allOption = await p.select({
    message: "Which AI tools do you want to install for?",
    options: [
      { label: `All (${compatible.length} agents)`, value: "all" as const },
      { label: "Select specific tools...", value: "select" as const },
    ],
  });

  if (p.isCancel(allOption)) return allOption;
  if (allOption === "all") return compatible;

  const result = await p.multiselect({
    message: "Select tools",
    options: compatible.map((tool) => ({
      label: AI_TOOLS[tool].name,
      value: tool,
      hint: AI_TOOLS[tool].projectRoot,
    })),
    initialValues: ["claude" as AITool],
    required: true,
  });

  return result as AITool[] | symbol;
}

export async function selectScope(includeLocal = false): Promise<InstallScope | symbol> {
  const options: { label: string; value: InstallScope; hint: string }[] = [
    { label: "Project", value: "project", hint: includeLocal ? "current directory, settings.json" : "current directory" },
    ...(includeLocal
      ? [{ label: "Local", value: "local" as InstallScope, hint: "current directory, settings.local.json" }]
      : []),
    { label: "User", value: "user", hint: "home directory" },
  ];
  const result = await p.select({ message: "Installation scope", options });
  return result as InstallScope | symbol;
}

export async function selectMethod(symlinkPath: string): Promise<InstallMethod | symbol> {
  const result = await p.select({
    message: "Installation method",
    options: [
      { label: "Symlink", value: "symlink" as const, hint: `shared at ${symlinkPath}` },
      { label: "Copy", value: "copy" as const, hint: "standalone copy per tool" },
    ],
  });
  return result as InstallMethod | symbol;
}

export async function confirm(message: string): Promise<boolean | symbol> {
  return p.confirm({ message });
}

export function cancelled(): void {
  p.cancel("Operation cancelled");
  process.exit(0);
}

export function intro(message: string): void {
  p.intro(chalk.bgCyan.black(` ${message} `));
}

export function outro(message: string): void {
  p.outro(chalk.green(message));
}

export function step(message: string): void {
  p.log.step(message);
}

export function info(message: string): void {
  p.log.info(message);
}

export function success(message: string): void {
  p.log.success(message);
}

export function warn(message: string): void {
  p.log.warn(message);
}

export function error(message: string): void {
  p.log.error(message);
}

export function message(message: string): void {
  p.log.message(message);
}

export { p as prompts };
