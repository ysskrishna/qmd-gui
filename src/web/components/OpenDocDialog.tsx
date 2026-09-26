import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpen: (target: string) => void;
};

export function OpenDocDialog({ open, onClose, onOpen }: Props) {
  const [value, setValue] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
        role="dialog"
        aria-labelledby="open-doc-title"
      >
        <h2 id="open-doc-title" className="text-lg font-semibold">
          Open by path or docid
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          e.g. <code className="font-mono text-xs">notes/readme.md</code> or{" "}
          <code className="font-mono text-xs">#129047</code>
        </p>
        <input
          className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const t = value.trim();
              if (!t) return;
              onOpen(t.startsWith("#") ? t : t);
              onClose();
              setValue("");
            }}
          >
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}
