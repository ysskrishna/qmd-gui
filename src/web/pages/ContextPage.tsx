import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import { apiFetch } from "@/lib/api.js";
import { fetchCollections } from "@/lib/queries.js";

type ContextResponse = {
  rows: Array<{
    collection: string;
    path: string;
    text: string;
    isGlobal?: boolean;
  }>;
};

export function ContextPage() {
  const queryClient = useQueryClient();
  const { runJob } = useActivity();
  const q = useQuery({
    queryKey: ["context"],
    queryFn: () => apiFetch<ContextResponse>("/api/context"),
  });
  const colsQ = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  const globalRow = q.data?.rows.find((r) => r.isGlobal || r.collection === "/");
  const tableRows = q.data?.rows.filter((r) => !r.isGlobal && r.collection !== "/") ?? [];

  const missingContext = useMemo(() => {
    const names = colsQ.data?.collections.map((c) => c.name) ?? [];
    const withCtx = new Set(tableRows.map((r) => r.collection));
    return names.filter((n) => !withCtx.has(n));
  }, [colsQ.data, tableRows]);

  const [globalText, setGlobalText] = useState("");
  const [addColl, setAddColl] = useState("");
  const [addPath, setAddPath] = useState("");
  const [addText, setAddText] = useState("");

  async function addGlobal(e: React.FormEvent) {
    e.preventDefault();
    const text = globalText.trim();
    if (!text) return;
    const job = await runJob("context.add", { path: "/", text });
    if (job.exitCode !== 0) {
      toast.error(`Failed (exit ${job.exitCode})`);
      return;
    }
    setGlobalText("");
    await queryClient.invalidateQueries({ queryKey: ["context"] });
    toast.success("Global context updated");
  }

  async function removeGlobal() {
    const job = await runJob("context.rm", { path: "/" });
    if (job.exitCode !== 0) {
      toast.error(`Failed (exit ${job.exitCode})`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["context"] });
  }

  async function addScoped(e: React.FormEvent) {
    e.preventDefault();
    const coll = addColl.trim();
    const text = addText.trim();
    if (!coll || !text) return;
    const folder = addPath.replace(/^\/+|\/+$/g, "");
    const target = folder ? `${coll}/${folder}` : `${coll}/`;
    const job = await runJob("context.add", { path: target, text });
    if (job.exitCode !== 0) {
      toast.error(`Failed (exit ${job.exitCode})`);
      return;
    }
    setAddText("");
    setAddPath("");
    await queryClient.invalidateQueries({ queryKey: ["context"] });
    toast.success("Context added");
  }

  return (
    <>
      <PageHeader
        title="Context"
        description="Descriptions attached to collections and paths. From qmd context list."
      />

      <section className="mb-8 rounded-lg border border-border p-4">
        <h2 className="font-medium">Global context</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Applies to every collection. <code className="font-mono text-xs">qmd context add /</code>
        </p>
        {globalRow && (
          <p className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm">{globalRow.text}</p>
        )}
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => void addGlobal(e)}>
          <input
            className="h-10 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Describe your knowledge base…"
            value={globalText}
            onChange={(e) => setGlobalText(e.target.value)}
          />
          <Button type="submit" disabled={!globalText.trim()}>Add / replace</Button>
          {globalRow && (
            <Button type="button" variant="outline" onClick={() => void removeGlobal()}>
              Remove global
            </Button>
          )}
        </form>
      </section>

      <QueryState loading={q.isLoading} error={q.error}>
        <h2 className="mb-3 font-medium">By collection and folder</h2>
        <QueryState empty={!tableRows.length} emptyMessage="No scoped context rows yet.">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Collection</th>
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-xs">{row.collection}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {row.path === "/" ? "(root)" : row.path}
                    </td>
                    <td className="px-3 py-2">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
      </QueryState>

      {missingContext.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No context yet for: {missingContext.join(", ")}. Add descriptions so search results carry useful summaries.
        </p>
      )}

      <form
        className="mt-8 max-w-xl space-y-3 rounded-lg border border-border p-4"
        onSubmit={(e) => void addScoped(e)}
      >
        <h2 className="font-medium">Add context</h2>
        <label className="block text-sm">
          <span className="font-medium">Collection</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={addColl}
            onChange={(e) => setAddColl(e.target.value)}
          >
            <option value="">Select…</option>
            {colsQ.data?.collections.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Folder (optional)</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
            value={addPath}
            onChange={(e) => setAddPath(e.target.value)}
            placeholder="docs/api"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Description</span>
          <textarea
            className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={!addColl || !addText.trim()}>Add context</Button>
      </form>
    </>
  );
}
