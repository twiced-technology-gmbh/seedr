import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-1.5 text-sm ${className}`}>
      <Link
        to="/"
        className="text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
          {item.href ? (
            <Link
              to={item.href}
              className="flex items-center gap-1.5 text-subtext hover:text-text transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-text">
              {item.icon}
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
