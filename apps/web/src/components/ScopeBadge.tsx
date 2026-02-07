import { Badge } from "./ui/Badge";
import { Tooltip } from "./ui/Tooltip";
import { scopeToBadgeColor, scopeLabels } from "@/lib/colors";
import type { ScopeType } from "@/lib/types";

const scopeDescriptions: Record<ScopeType, string> = {
  user: "Built for user-level installation. May not work correctly in other scopes.",
  project: "Built for project-level installation. May not work correctly in other scopes.",
  local: "Built for local settings (gitignored). May not work correctly in other scopes.",
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
