import { toolLabels, sourceLabels, scopeLabels } from "./colors";

export const toolOptions = [
  { value: "claude", label: toolLabels.claude },
  { value: "copilot", label: toolLabels.copilot },
  { value: "gemini", label: toolLabels.gemini },
  { value: "codex", label: toolLabels.codex },
  { value: "opencode", label: toolLabels.opencode },
];

export const sourceOptions = [
  { value: "official", label: sourceLabels.official },
  { value: "toolr", label: sourceLabels.toolr },
  { value: "community", label: sourceLabels.community },
];

export const scopeOptions = [
  { value: "user", label: scopeLabels.user },
  { value: "project", label: scopeLabels.project },
  { value: "local", label: scopeLabels.local },
];
