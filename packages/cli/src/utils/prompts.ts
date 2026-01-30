import inquirer from "inquirer";
import type { AITool, InstallScope, InstallMethod, RegistryItem } from "../types.js";
import { AI_TOOLS } from "../config/tools.js";

export async function promptSkillSelection(
  items: RegistryItem[]
): Promise<RegistryItem> {
  const { skill } = await inquirer.prompt<{ skill: RegistryItem }>([
    {
      type: "list",
      name: "skill",
      message: "Select a skill to install:",
      choices: items.map((item) => ({
        name: `${item.name} - ${item.description}`,
        value: item,
        short: item.name,
      })),
    },
  ]);
  return skill;
}

export async function promptToolSelection(
  compatible: AITool[]
): Promise<AITool[]> {
  const choices = compatible.map((tool) => ({
    name: AI_TOOLS[tool].name,
    value: tool,
    checked: tool === "claude",
  }));

  const { tools } = await inquirer.prompt<{ tools: AITool[] }>([
    {
      type: "checkbox",
      name: "tools",
      message: "Which AI tools do you want to install for?",
      choices,
      validate: (answer) =>
        answer.length > 0 ? true : "Please select at least one tool",
    },
  ]);
  return tools;
}

export async function promptScope(): Promise<InstallScope> {
  const { scope } = await inquirer.prompt<{ scope: InstallScope }>([
    {
      type: "list",
      name: "scope",
      message: "Installation scope:",
      choices: [
        {
          name: "Project (current directory)",
          value: "project",
          short: "Project",
        },
        { name: "User (home directory)", value: "user", short: "User" },
        { name: "Global (system-wide)", value: "global", short: "Global" },
      ],
      default: "project",
    },
  ]);
  return scope;
}

export async function promptMethod(): Promise<InstallMethod> {
  const { method } = await inquirer.prompt<{ method: InstallMethod }>([
    {
      type: "list",
      name: "method",
      message: "Installation method:",
      choices: [
        {
          name: "Symlink (recommended - single source of truth)",
          value: "symlink",
          short: "Symlink",
        },
        {
          name: "Copy (standalone copy of file)",
          value: "copy",
          short: "Copy",
        },
      ],
      default: "symlink",
    },
  ]);
  return method;
}

export async function promptConfirm(
  message: string,
  defaultValue = true
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: defaultValue,
    },
  ]);
  return confirmed;
}

export async function promptSearch(
  message = "Search for a skill:"
): Promise<string> {
  const { query } = await inquirer.prompt<{ query: string }>([
    {
      type: "input",
      name: "query",
      message,
    },
  ]);
  return query.trim();
}
