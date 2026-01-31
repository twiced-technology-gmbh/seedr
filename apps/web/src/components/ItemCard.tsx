import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card } from "./ui/Card";
import { Tooltip } from "./ui/Tooltip";
import { TypeIcon } from "./TypeIcon";
import { SourceBadge } from "./SourceBadge";
import { CompatibilityBadges } from "./CompatibilityBadges";
import { formatRelativeTime } from "@/lib/text";
import { typeLabels } from "@/lib/colors";
import type { RegistryItem } from "@/lib/types";

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
          </div>
          <Tooltip content={{ title: typeLabels[item.type] }} position="top">
            <TypeIcon type={item.type} size={16} className="opacity-60" />
          </Tooltip>
        </div>

        <h3 className="text-sm font-medium text-text mb-0.5">{item.name}</h3>
        {item.author && (
          <p className="text-xs text-text-dim mb-1.5">by {item.author.name}</p>
        )}
        <p className="text-subtext text-xs mb-3 flex-grow line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <CompatibilityBadges tools={item.compatibility} />
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
