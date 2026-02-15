import { Sparkles, Bot, Webhook, Terminal, Plug } from "lucide-react";
import { typeTextColors } from "@/lib/colors";

interface PluginContentsProps {
  counts: Record<string, number>;
  className?: string;
}

const extensionTypes = [
  { type: "skill", icon: Sparkles, label: "Skills" },
  { type: "agent", icon: Bot, label: "Agents" },
  { type: "hook", icon: Webhook, label: "Hooks" },
  { type: "command", icon: Terminal, label: "Commands" },
  { type: "mcp", icon: Plug, label: "MCP Servers" },
] as const;

export function PluginContents({ counts, className = "" }: PluginContentsProps) {
  const items = extensionTypes
    .map(({ type, icon, label }) => {
      const count = counts[type];
      if (!count || count <= 0) return null;
      return { type, icon, label, count };
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
              key={item.type}
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
