import { Link } from "react-router-dom";
import { Clock, Sparkles, Bot, Webhook, Terminal, Server } from "lucide-react";
import { Card } from "./ui/Card";
import { Tooltip } from "./ui/Tooltip";
import { TypeIcon } from "./TypeIcon";
import { SourceBadge } from "./SourceBadge";
import { ScopeBadge } from "./ScopeBadge";
import { CompatibilityBadges } from "./CompatibilityBadges";
import { formatRelativeTime } from "@/lib/text";
import { typeLabels, typeTextColors } from "@/lib/colors";
import type { RegistryItem, PluginContents } from "@/lib/types";

const contentTypes = [
  { key: "skills", icon: Sparkles, type: "skill", label: "Skills" },
  { key: "agents", icon: Bot, type: "agent", label: "Agents" },
  { key: "hooks", icon: Webhook, type: "hook", label: "Hooks" },
  { key: "commands", icon: Terminal, type: "command", label: "Commands" },
  { key: "mcpServers", icon: Server, type: "mcp", label: "MCP Servers" },
] as const;

function ContentsBadges({ contents }: { contents: PluginContents }) {
  const items = contentTypes
    .map(({ key, icon, type, label }) => {
      const list = contents[key];
      if (!list || list.length === 0) return null;
      return { key, icon, type, label, count: list.length };
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
          <Tooltip key={item.key} content={{ title: `${item.count} ${item.label}` }} position="top">
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

interface ItemCardProps {
  item: RegistryItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/${item.type}s/${item.slug}`}>
      <Card className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {item.sourceType && <SourceBadge source={item.sourceType} />}
            {item.recommendedScope && <ScopeBadge scope={item.recommendedScope} />}
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
          <CompatibilityBadges tools={item.compatibility} />
          {item.contents && <ContentsBadges contents={item.contents} />}
          {item.updatedAt && (
            <span className="flex items-center gap-1 text-[10px] text-text-dim">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(item.updatedAt)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
