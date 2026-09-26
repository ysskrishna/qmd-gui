import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import { fetchFsDirs, pickFolderNative } from "@/lib/collections-api.js";
import {
  defaultCollectionName,
  validateCollectionAddPath,
} from "@shared/collection-add.js";
import { buildJobArgv } from "@shared/commands.js";
import { CommandPreview } from "@/components/CommandPreview";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function AddCollectionDialog({ open, onClose, onAdded }: Props) {
  const { runJob } = useActivity();
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [mask, setMask] = useState("**/*.md");
  const [browsePath, setBrowsePath] = useState<string | null>(null);
  const [dirs, setDirs] = useState<Array<{ name: string; path: string }>>([]);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPath("");
    setName("");
    setMask("**/*.md");
    setBrowsePath(null);
    setDirs([]);
    setBrowseError(null);
  }, [open]);

  useEffect(() => {
    if (!open || browsePath === null) return;
    void fetchFsDirs(browsePath)
      .then((res) => {
        setDirs(res.dirs);
        setBrowseError(null);
      })
      .catch((err) => {
        setBrowseError(err instanceof Error ? err.message : "Cannot list folders");
        setDirs([]);
      });
  }, [open, browsePath]);

  if (!open) return null;

  const validated = validateCollectionAddPath(path);
  const resolvedName = name.trim() || (validated.ok ? defaultCollectionName(validated.path) : "");
  const previewArgv =
    validated.ok && resolvedName
      ? buildJobArgv("collection.add", {
          path: validated.path,
          name: resolvedName,
          mask: mask.trim() || "**/*.md",
        })
      : ["collection", "add", "<path>", "<name>"];

  async function onBrowseNative() {
    try {
      const picked = await pickFolderNative();
      setPath(picked);
      setName(defaultCollectionName(picked));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Folder picker failed");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }
    if (!resolvedName) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const job = await runJob("collection.add", {
        path: validated.path,
        name: resolvedName,
        mask: mask.trim() || "**/*.md",
      });
      if (job.exitCode !== 0) {
        toast.error(`Add failed (exit ${job.exitCode})`);
        return;
      }
      toast.success(`Collection “${resolvedName}” added`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        onSubmit={(e) => void onSubmit(e)}
        role="dialog"
        aria-labelledby="add-coll-title"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 id="add-coll-title" className="text-lg font-semibold">
            Add collection
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A collection is a folder. qmd indexes matching files inside it.
          </p>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="block text-sm">
            <span className="font-medium">Folder path</span>
            <div className="mt-1 flex gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  if (!name.trim() && e.target.value) {
                    const v = validateCollectionAddPath(e.target.value);
                    if (v.ok) setName(defaultCollectionName(v.path));
                  }
                }}
                placeholder="/Users/you/Documents/notes"
              />
              <Button type="button" variant="outline" onClick={() => void onBrowseNative()}>
                Browse…
              </Button>
            </div>
          </label>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Or pick from home</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBrowsePath(browsePath === null ? "" : browsePath)}
              >
                {browsePath === null ? "Show browser" : "Hide"}
              </Button>
            </div>
            {browsePath !== null && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                {browseError && (
                  <p className="p-2 text-xs text-destructive">{browseError}</p>
                )}
                <ul className="divide-y text-sm">
                  {dirs.map((d) => (
                    <li key={d.path}>
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left hover:bg-muted/60"
                        onClick={() => {
                          setPath(d.path);
                          setName(defaultCollectionName(d.path));
                        }}
                      >
                        {d.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <label className="block text-sm">
            <span className="font-medium">Name</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="notes"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Pattern</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Default <code className="font-mono">**/*.md</code>
            </span>
          </label>
          <CommandPreview argv={previewArgv} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !validated.ok}>
            {saving ? "Adding…" : "Add and index"}
          </Button>
        </div>
      </form>
    </div>
  );
}
