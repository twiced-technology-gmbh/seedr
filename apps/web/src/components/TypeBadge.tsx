import type { ComponentType } from "@/lib/types";
import { typeToBadgeColor, typeLabels } from "@/lib/colors";
import { Badge } from "./ui/Badge";

interface TypeBadgeProps {
  type: ComponentType;
  className?: string;
  size?: "sm" | "md";
}

export function TypeBadge({ type, className = "", size = "sm" }: TypeBadgeProps) {
  return (
    <Badge color={typeToBadgeColor[type]} size={size} className={className}>
      {typeLabels[type]}
    </Badge>
  );
}
