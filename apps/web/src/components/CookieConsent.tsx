import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/Button";

const COOKIE_CONSENT_KEY = "seedr-cookie-consent";

type ConsentChoice = "accepted" | "declined" | "essential";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (choice: ConsentChoice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-surface/95 backdrop-blur-sm border-t border-overlay/50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-grow">
          <p className="text-sm text-text mb-1">We value your privacy</p>
          <p className="text-xs text-subtext">
            This site uses only essential cookies for functionality. No tracking
            or analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleConsent("declined")}
          >
            Decline
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleConsent("essential")}
          >
            Essential Only
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleConsent("accepted")}
          >
            Accept All
          </Button>
        </div>

        <button
          onClick={() => handleConsent("declined")}
          className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto flex items-center justify-center w-[26px] h-[26px] rounded-lg text-subtext border border-overlay hover:bg-surface hover:border-overlay-hover hover:text-text transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
