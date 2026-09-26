import { toShell } from "@shared/shell.js";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  argv: string[];
  className?: string;
};

export function CommandPreview({ argv, className }: Props) {
  const command = toShell(argv);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-[10px] border border-border bg-muted/40 p-2",
        className,
      )}
    >
      <code className="min-w-0 flex-1 overflow-x-auto px-2 py-1.5 font-mono text-xs leading-relaxed">
        {command}
      </code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => void copy()}
        aria-label="Copy command"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copy
      </Button>
    </div>
  );
}
