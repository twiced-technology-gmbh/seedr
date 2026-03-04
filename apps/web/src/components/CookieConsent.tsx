import { CookieConsent as CookieConsentBase } from "@toolr/ui-design";

export function CookieConsent() {
  return (
    <CookieConsentBase
      storageKey="seedr-cookie-consent"
      accentColor="cyan"
    />
  );
}
