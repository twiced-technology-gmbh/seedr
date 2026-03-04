import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { ToolrAppLogo, IconButton } from "@toolr/ui-design";
import { TwiceDLogo } from "./TwiceDLogo";

export function Header() {
  return (
    <header className="h-[44px] border-b border-overlay bg-surface">
      <div className="px-4 h-full flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-all"
        >
          <ToolrAppLogo
            app="seedr"
            size={28}
            className="group-hover:opacity-80 transition-opacity"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text tracking-tight group-hover:text-teal-300 transition-colors leading-none">
              Seedr
            </span>
            <span className="text-xs text-text-dim tracking-wide uppercase leading-none mt-0.5">
              Toolr Suite
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <IconButton
            icon={<ToolrAppLogo app="toolr" size={14} />}
            href="https://toolr.dev"
            size="sm"
            color="blue"
            tooltip={{ description: "Visit toolr.dev" }}
            tooltipPosition="bottom"
          />
          <IconButton
            icon={<TwiceDLogo size={14} />}
            href="https://twiced.de"
            size="sm"
            color="cyan"
            tooltip={{ description: "Visit twiced.de" }}
            tooltipPosition="bottom"
          />
          <IconButton
            icon={<Github className="w-3.5 h-3.5" />}
            href="https://github.com/twiced-technology-gmbh/seedr"
            size="sm"
            color="neutral"
            tooltip={{ description: "View source code" }}
            tooltipPosition="bottom"
          />
        </nav>
      </div>
    </header>
  );
}
