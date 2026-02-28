import inquirer from "inquirer";
import type { AITool, InstallScope, InstallMethod, RegistryItem } from "../types.js";
import { AI_TOOLS } from "../config/tools.js";

export async function promptSkillSelection(
  items: RegistryItem[]
): Promise<RegistryItem> {
  const { skill } = await inquirer.prompt<{ skill: RegistryItem }>([
    {
      type: "select",
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
  const { selection } = await inquirer.prompt<{ selection: "all" | "select" }>([
    {
      type: "select",
      name: "selection",
      message: "Which AI tools do you want to install for?",
      choices: [
        {
          name: `All (${compatible.length} agents)`,
          value: "all",
          short: "All",
        },
        {
          name: "Select specific tools...",
          value: "select",
          short: "Select",
        },
      ],
    },
  ]);

  if (selection === "all") {
    return compatible;
  }

  const choices = compatible.map((tool) => ({
    name: AI_TOOLS[tool].name,
    value: tool,
    checked: tool === "claude",
  }));

  const { tools } = await inquirer.prompt<{ tools: AITool[] }>([
    {
      type: "checkbox",
      name: "tools",
      message: "Select tools:",
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
      type: "select",
      name: "scope",
      message: "Installation scope:",
      choices: [
        {
          name: "Project (current directory)",
          value: "project",
          short: "Project",
        },
        { name: "User (home directory)", value: "user", short: "User" },
      ],
      default: "project",
    },
  ]);
  return scope;
}

export async function promptMethod(): Promise<InstallMethod> {
  const { method } = await inquirer.prompt<{ method: InstallMethod }>([
    {
      type: "select",
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
