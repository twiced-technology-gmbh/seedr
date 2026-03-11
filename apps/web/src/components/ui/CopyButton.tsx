import { useState } from "react";
import { IconButton } from "@toolr/ui-design";

/** Duration to show "Copied!" feedback before resetting */
const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <IconButton
      icon={copied ? "check" : "copy"}
      size="xs"
      tooltip={{ description: copied ? "Copied!" : "Copy" }}
      onClick={handleCopy}
    />
  );
}
