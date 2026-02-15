import { Sparkles, Bot, Webhook, Terminal, Plug } from "lucide-react";
import type { PluginContents as PluginContentsType } from "@/lib/types";
import { typeTextColors } from "@/lib/colors";

interface PluginContentsProps {
  contents: PluginContentsType;
  className?: string;
}

const contentTypes = [
  { key: "skills", icon: Sparkles, label: "Skills", type: "skill" },
  { key: "agents", icon: Bot, label: "Agents", type: "agent" },
  { key: "hooks", icon: Webhook, label: "Hooks", type: "hook" },
  { key: "commands", icon: Terminal, label: "Commands", type: "command" },
  { key: "mcpServers", icon: Plug, label: "MCP Servers", type: "mcp" },
] as const;

export function PluginContents({ contents, className = "" }: PluginContentsProps) {
  const items = contentTypes
    .map(({ key, icon, label, type }) => {
      const list = contents[key];
      if (!list || list.length === 0) return null;
      return { key, icon, label, type, count: list.length, items: list };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">Contains</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          const colorClass = typeTextColors[item.type as keyof typeof typeTextColors];
          return (
            <div
              key={item.key}
              className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2"
            >
              <Icon className={`w-4 h-4 ${colorClass}`} />
              <span className="text-sm text-text font-medium">{item.count}</span>
              <span className="text-sm text-subtext">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
