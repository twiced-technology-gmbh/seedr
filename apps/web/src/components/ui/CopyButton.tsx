import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Duration to show "Copied!" feedback before resetting */
const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center w-[26px] h-[26px] rounded-lg text-subtext border border-overlay hover:bg-surface hover:border-overlay-hover hover:text-text transition-all ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}
