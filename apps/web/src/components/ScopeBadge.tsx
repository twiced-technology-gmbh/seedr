import { Label } from "@toolr/ui-design";
import type { IconName } from "@toolr/ui-design";
import { scopeToBadgeColor, scopeLabels } from "@/lib/colors";
import type { ScopeType } from "@/lib/types";

const scopeIcons: Record<ScopeType, IconName> = {
  user: "user",
  project: "folder",
  local: "lock",
};

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
    <Label
      text={scopeLabels[scope]}
      color={scopeToBadgeColor[scope]}
      icon={scopeIcons[scope]}
      size={size}
      tooltip={{
        title: `${scopeLabels[scope]} Scope`,
        description: scopeDescriptions[scope],
      }}
      className={className}
    />
  );
}
