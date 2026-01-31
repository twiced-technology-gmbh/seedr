import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-overlay bg-surface mt-auto">
      <div className="px-4 py-4 flex items-center justify-end gap-3 text-xs text-subtext">
        <nav className="flex items-center gap-3">
          <Link
            to="/privacy"
            className="hover:text-text transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/impressum"
            className="hover:text-text transition-colors"
          >
            Impressum
          </Link>
        </nav>
      </div>
    </footer>
  );
}
