import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/QueryState";
import { apiFetch } from "@/lib/api.js";
import { cn } from "@/lib/utils";

type DocResponse = {
  uri: string;
  docid: string | null;
  folderContext: string | null;
  lines: Array<{ number: number; text: string }>;
};

type Props = {
  target: string | null;
  onClose: () => void;
};

function DocDrawerContent({ target, onClose }: Props) {
  const [fromLine, setFromLine] = useState("");
  const [lineCount, setLineCount] = useState("");

  const q = useQuery({
    queryKey: ["doc", target, fromLine, lineCount],
    queryFn: () => {
      if (!target) throw new Error("no target");
      const params = new URLSearchParams({ target });
      if (fromLine) params.set("from", fromLine);
      if (lineCount) params.set("lines", lineCount);
      return apiFetch<DocResponse>(`/api/docs?${params}`);
    },
    enabled: Boolean(target),
  });

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label="Close document"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col border-l border-border bg-card shadow-xl",
        )}
        aria-label="Document"
      >
        <header className="flex items-start gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-muted-foreground">
              {q.data?.uri ?? target}
            </p>
            {q.data?.docid && (
              <p className="font-mono text-xs">{q.data.docid}</p>
            )}
            {q.data?.folderContext && (
              <p className="mt-1 text-xs text-muted-foreground">
                {q.data.folderContext}
              </p>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            From line
            <input
              className="h-9 w-24 rounded-md border border-input bg-background px-2 font-mono text-sm"
              value={fromLine}
              onChange={(e) => setFromLine(e.target.value)}
              placeholder="1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Lines (-l)
            <input
              className="h-9 w-24 rounded-md border border-input bg-background px-2 font-mono text-sm"
              value={lineCount}
              onChange={(e) => setLineCount(e.target.value)}
              placeholder="all"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (q.data?.docid) void navigator.clipboard.writeText(q.data.docid);
            }}
          >
            Copy docid
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void navigator.clipboard.writeText(q.data?.uri ?? target)}
          >
            Copy path
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
          <QueryState loading={q.isLoading} error={q.error}>
            {q.data?.lines.map((line) => (
              <div key={line.number} className="flex gap-3">
                <span className="w-8 shrink-0 text-right text-muted-foreground">
                  {line.number}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap">{line.text}</span>
              </div>
            ))}
          </QueryState>
        </div>
      </aside>
    </>
  );
}

export function DocDrawer({ target, onClose }: Props) {
  if (!target) return null;
  return <DocDrawerContent key={target} target={target} onClose={onClose} />;
}
