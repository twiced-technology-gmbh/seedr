import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Logo } from "./Logo";
import { TwiceDLogo } from "./TwiceDLogo";
import { IconButton } from "./ui/Button";

export function Header() {
  return (
    <header className="h-[45px] border-b border-overlay bg-surface">
      <div className="px-4 h-full flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-all"
        >
          <Logo
            size={28}
            className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text tracking-tight group-hover:text-emerald-300 transition-colors leading-none">
              Seedr
            </span>
            <span className="text-xs text-text-dim tracking-wide uppercase leading-none mt-0.5">
              Toolr Suite
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <a href="https://toolr.dev" target="_blank" rel="noopener noreferrer">
            <IconButton
              icon={<Logo size={14} />}
              size="sm"
              variant="toolr"
              tooltip={{
                title: "Toolr Suite",
                description: "Visit toolr.dev",
              }}
              tooltipPosition="bottom"
              tooltipAlign="end"
            />
          </a>
          <a href="https://twiced.de" target="_blank" rel="noopener noreferrer">
            <IconButton
              icon={<TwiceDLogo size={14} />}
              size="sm"
              variant="twiced"
              tooltip={{
                title: "TwiceD",
                description: "Visit twiced.de",
              }}
              tooltipPosition="bottom"
              tooltipAlign="end"
            />
          </a>
          <a href="https://github.com/toolr-suite/seedr" target="_blank" rel="noopener noreferrer">
            <IconButton
              icon={<Github className="w-3.5 h-3.5" />}
              size="sm"
              variant="white"
              tooltip={{
                title: "GitHub",
                description: "View source code",
              }}
              tooltipPosition="bottom"
              tooltipAlign="end"
            />
          </a>
        </nav>
      </div>
    </header>
  );
}
