import { Badge } from "./ui/Badge";
import { Tooltip } from "./ui/Tooltip";
import { scopeToBadgeColor, scopeLabels } from "@/lib/colors";
import type { ScopeType } from "@/lib/types";

const scopeDescriptions: Record<ScopeType, string> = {
  user: "Recommended for user-level installation\nThis is our recommendation only. You can install any item at any scope.",
  project: "Recommended for project-level installation\nThis is our recommendation only. You can install any item at any scope.",
  local: "Recommended for local settings (gitignored)\nThis is our recommendation only. You can install any item at any scope.",
};

interface ScopeBadgeProps {
  scope: ScopeType;
  className?: string;
  size?: "sm" | "md";
}

export function ScopeBadge({ scope, className = "", size = "sm" }: ScopeBadgeProps) {
  return (
    <Tooltip
      content={{
        title: `${scopeLabels[scope]} Scope`,
        description: scopeDescriptions[scope],
      }}
      position="top"
    >
      <Badge color={scopeToBadgeColor[scope]} size={size} className={className}>
        {scopeLabels[scope]}
      </Badge>
    </Tooltip>
  );
}
