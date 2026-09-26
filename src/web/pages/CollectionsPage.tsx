import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AddCollectionDialog } from "@/components/collections/AddCollectionDialog";
import { CollectionShowDialog } from "@/components/collections/CollectionShowDialog";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import { fetchCollections, type CollectionRow } from "@/lib/queries.js";
import { cn } from "@/lib/utils";

export function CollectionsPage() {
  const q = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const queryClient = useQueryClient();
  const { runJob } = useActivity();
  const [addOpen, setAddOpen] = useState(false);
  const [showName, setShowName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<CollectionRow | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleInclude(c: CollectionRow) {
    setToggling(c.name);
    try {
      const kind = c.excluded ? "collection.include" : "collection.exclude";
      const job = await runJob(kind, { name: c.name });
      if (job.exitCode !== 0) {
        toast.error(`Failed (exit ${job.exitCode})`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setToggling(null);
    }
  }

  async function runEmbed(name: string) {
    setMenuOpen(null);
    const job = await runJob("embed", { collection: name });
    if (job.exitCode !== 0) toast.error(`Embed failed (exit ${job.exitCode})`);
    else toast.success("Embed job finished");
  }

  async function runRemove(name: string) {
    setMenuOpen(null);
    if (!window.confirm(`Remove collection “${name}” from the index?`)) return;
    const job = await runJob("collection.remove", { name });
    if (job.exitCode !== 0) {
      toast.error(`Remove failed (exit ${job.exitCode})`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success("Collection removed");
  }

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget) return;
    const to = renameTo.trim();
    if (!to || to === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    const job = await runJob("collection.rename", {
      from: renameTarget.name,
      to,
    });
    if (job.exitCode !== 0) {
      toast.error(`Rename failed (exit ${job.exitCode})`);
      return;
    }
    setRenameTarget(null);
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success(`Renamed to ${to}`);
  }

  return (
    <>
      <PageHeader
        title="Collections"
        description="Folders qmd indexes. From qmd collection list and index.yml."
        actions={
          <Button type="button" onClick={() => setAddOpen(true)}>
            Add collection
          </Button>
        }
      />
      <QueryState loading={q.isLoading} error={q.error}>
        <QueryState empty={!q.data?.collections.length} emptyMessage="No collections yet.">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Files match</th>
                  <th className="px-3 py-2 font-medium text-right">Files</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Default search</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {q.data?.collections.map((c) => (
                  <tr key={c.name} className="group hover:bg-muted/20">
                    <td className="px-3 py-3">
                      <Link
                        to={`/collections/${encodeURIComponent(c.name)}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {String(c.config?.path ?? c.uri)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <code className="text-xs">{c.pattern}</code>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.files}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {c.updatedLabel ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!c.excluded}
                        aria-label={`Include ${c.name} in default search`}
                        disabled={toggling === c.name}
                        className={cn(
                          "h-6 w-11 rounded-full transition-colors disabled:opacity-50",
                          !c.excluded ? "bg-primary" : "bg-muted",
                        )}
                        onClick={() => void toggleInclude(c)}
                      />
                    </td>
                    <td className="relative px-2 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${c.name}`}
                        onClick={() =>
                          setMenuOpen(menuOpen === c.name ? null : c.name)
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                      {menuOpen === c.name && (
                        <div
                          className="absolute right-2 top-full z-10 min-w-[10rem] rounded-md border border-border bg-card py-1 shadow-md"
                          role="menu"
                        >
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setMenuOpen(null);
                              setShowName(c.name);
                            }}
                          >
                            Show
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => void runEmbed(c.name)}
                          >
                            Embed
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setMenuOpen(null);
                              setRenameTarget(c);
                              setRenameTo(c.name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                            onClick={() => void runRemove(c.name)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Default search uses include/exclude. Excluded collections are still searchable when you pick them on the Search page (-c).
          </p>
        </QueryState>
      </QueryState>

      <AddCollectionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => void queryClient.invalidateQueries({ queryKey: ["collections"] })}
      />
      <CollectionShowDialog name={showName} onClose={() => setShowName(null)} />

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
            onSubmit={(e) => void submitRename(e)}
          >
            <h2 className="text-lg font-semibold">Rename collection</h2>
            <input
              className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit">Rename</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
