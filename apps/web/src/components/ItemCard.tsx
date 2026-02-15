import { Link } from "react-router-dom";
import { Clock, Sparkles, Bot, Webhook, Terminal, Plug, BookOpen } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { Tooltip } from "./ui/Tooltip";
import { TypeIcon } from "./TypeIcon";
import { SourceBadge } from "./SourceBadge";
import { ScopeBadge } from "./ScopeBadge";
import { ToolIcon } from "./ToolIcon";
import { formatRelativeTime } from "@/lib/text";
import { typeLabels, typeTextColors, toolLabels } from "@/lib/colors";
import type { RegistryItem, SourceType, ScopeType, AITool } from "@/lib/types";

const extensionIcons = [
  { type: "skill", icon: Sparkles, label: "Skills" },
  { type: "agent", icon: Bot, label: "Agents" },
  { type: "hook", icon: Webhook, label: "Hooks" },
  { type: "command", icon: Terminal, label: "Commands" },
  { type: "mcp", icon: Plug, label: "MCP Servers" },
] as const;

function PackageBadges({ counts }: { counts: Record<string, number> }) {
  const items = extensionIcons
    .map(({ type, icon, label }) => {
      const count = counts[type];
      if (!count || count <= 0) return null;
      return { type, icon, label, count };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => {
        if (!item) return null;
        const Icon = item.icon;
        const colorClass = typeTextColors[item.type as keyof typeof typeTextColors];
        return (
          <Tooltip key={item.type} content={{ title: `${item.count} ${item.label}` }} position="top">
            <span className="flex items-center gap-0.5">
              <Icon className={`w-3 h-3 ${colorClass}`} />
              <span className="text-[10px] text-subtext">{item.count}</span>
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Wraps a click handler to stop event propagation (prevents Link navigation). */
function clickable(handler?: () => void) {
  if (!handler) return undefined;
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  };
}

interface ItemCardProps {
  item: RegistryItem;
  onSourceClick?: (source: SourceType) => void;
  onScopeClick?: (scope: ScopeType) => void;
  onToolClick?: (tool: AITool) => void;
  onDateClick?: () => void;
}

export function ItemCard({ item, onSourceClick, onScopeClick, onToolClick, onDateClick }: ItemCardProps) {
  const interactive = "cursor-pointer hover:brightness-125 transition-all";

  return (
    <Link to={`/${item.type}s/${item.slug}`}>
      <Card className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {item.sourceType && (
              <span onClick={clickable(onSourceClick ? () => onSourceClick(item.sourceType!) : undefined)} className={onSourceClick ? interactive : ""}>
                <SourceBadge source={item.sourceType} />
              </span>
            )}
            {item.pluginType === "wrapper" && (
              <Tooltip content={{ title: "Wrapper", description: `Wraps a single ${item.wrapper} extension as a plugin` }} position="top">
                <Badge color="teal">wrapper</Badge>
              </Tooltip>
            )}
            {item.pluginType === "integration" && (
              <Tooltip content={{ title: "Integration", description: "Integrates an external tool with your AI assistant. Installing adds it to enabledPlugins — the README explains how to set up the tool itself." }} position="top">
                <Badge color="purple" icon={BookOpen}>integration</Badge>
              </Tooltip>
            )}
            {item.sourceType === "toolr" && item.targetScope && (
              <span onClick={clickable(onScopeClick ? () => onScopeClick(item.targetScope!) : undefined)} className={onScopeClick ? interactive : ""}>
                <ScopeBadge scope={item.targetScope} />
              </span>
            )}
          </div>
          <Tooltip content={{ title: typeLabels[item.type] }} position="top">
            <TypeIcon type={item.type} size={16} className="opacity-60" />
          </Tooltip>
        </div>

        <h3 className="text-sm font-medium text-text mb-0.5">{item.name}</h3>
        {(item.author || item.sourceType === "toolr") && (
          <p className="text-xs text-text-dim mb-1.5">
            by {item.sourceType === "toolr" ? "TwiceD Technology" : item.author?.name}
          </p>
        )}
        <p className="text-subtext text-xs mb-3 flex-grow line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {item.compatibility.map((tool) => (
              <Tooltip key={tool} content={{ title: toolLabels[tool] }} position="top">
                <span onClick={clickable(onToolClick ? () => onToolClick(tool) : undefined)} className={onToolClick ? interactive : ""}>
                  <ToolIcon tool={tool} size={16} />
                </span>
              </Tooltip>
            ))}
          </div>
          {item.package && <PackageBadges counts={item.package} />}
          {item.updatedAt && (
            <span
              onClick={clickable(onDateClick)}
              className={`flex items-center gap-1 text-[10px] text-text-dim ${onDateClick ? interactive : ""}`}
            >
              <Clock className="w-3 h-3" />
              {formatRelativeTime(item.updatedAt)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
