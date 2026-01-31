import type { AITool } from "@/lib/types";
import { toolLabels } from "@/lib/colors";
import { ToolIcon } from "./ToolIcon";
import { Tooltip } from "./ui/Tooltip";

interface CompatibilityBadgesProps {
  tools: AITool[];
  className?: string;
  size?: "sm" | "md";
}

const iconSizes = { sm: 16, md: 24 };
const gapSizes = { sm: "gap-1.5", md: "gap-2" };

export function CompatibilityBadges({
  tools,
  className = "",
  size = "sm",
}: CompatibilityBadgesProps) {
  return (
    <div className={`flex flex-wrap ${gapSizes[size]} ${className}`}>
      {tools.map((tool) => (
        <Tooltip key={tool} content={{ title: toolLabels[tool] }} position="top">
          <ToolIcon tool={tool} size={iconSizes[size]} />
        </Tooltip>
      ))}
    </div>
  );
}
