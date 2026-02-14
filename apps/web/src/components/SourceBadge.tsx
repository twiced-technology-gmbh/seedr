import { Shield } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Tooltip } from "./ui/Tooltip";
import { sourceToBadgeColor, sourceLabels } from "@/lib/colors";
import type { SourceType } from "@/lib/types";

const sourceDescriptions: Record<SourceType, string> = {
  official: "Published by the tool maker",
  toolr: "Published by Toolr Suite",
  community: "Community contribution",
};

interface SourceBadgeProps {
  source: SourceType;
  className?: string;
  size?: "sm" | "md";
}

export function SourceBadge({ source, className = "", size = "sm" }: SourceBadgeProps) {
  return (
    <Tooltip content={{ title: sourceLabels[source], description: sourceDescriptions[source] }} position="top">
      <Badge color={sourceToBadgeColor[source]} size={size} icon={Shield} className={className}>
        {sourceLabels[source]}
      </Badge>
    </Tooltip>
  );
}
