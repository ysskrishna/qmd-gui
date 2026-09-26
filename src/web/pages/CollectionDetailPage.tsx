import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DocDrawer } from "@/components/DocDrawer";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { SettingsPlanPreview } from "@/components/collections/SettingsPlanPreview";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import {
  fetchCollectionConfig,
  fetchCollectionFiles,
  fetchCollectionShow,
} from "@/lib/collections-api.js";
import { executeSettingsPlan } from "@/lib/execute-settings-plan.js";
import { fetchCollections } from "@/lib/queries.js";
import { apiFetch } from "@/lib/api.js";
import {
  planSettings,
  type CollectionSettingsDraft,
} from "@shared/plan-settings.js";
import { cn } from "@/lib/utils";

type Tab = "files" | "settings" | "context";

export function CollectionDetailPage() {
  const { name: rawName } = useParams();
  const name = rawName ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "files";
  const queryClient = useQueryClient();
  const { runJob } = useActivity();

  const showQ = useQuery({
    queryKey: ["collection-show", name],
    queryFn: () => fetchCollectionShow(name),
    enabled: Boolean(name),
  });
  const configQ = useQuery({
    queryKey: ["collection-config", name],
    queryFn: () => fetchCollectionConfig(name),
    enabled: Boolean(name) && tab === "settings",
  });
  const colsQ = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const row = colsQ.data?.collections.find((c) => c.name === name);

  const [lsPrefix, setLsPrefix] = useState("");
  const filesQ = useQuery({
    queryKey: ["collection-files", name, lsPrefix],
    queryFn: () => fetchCollectionFiles(name, lsPrefix),
    enabled: Boolean(name) && tab === "files",
  });
  const [docTarget, setDocTarget] = useState<string | null>(null);

  const [draft, setDraft] = useState<CollectionSettingsDraft | null>(null);
  const [ignoreInput, setIgnoreInput] = useState("");
  const [saving, setSaving] = useState(false);

  const settingsDraft = useMemo(() => {
    if (!configQ.data || !showQ.data) return null;
    if (draft && draft.name === name) return draft;
    return {
      name,
      include: showQ.data.include,
      wasIncluded: showQ.data.include,
      path: configQ.data.path,
      pattern: configQ.data.pattern,
      ignore: [...configQ.data.ignore],
      updateCmd: configQ.data.update,
      previousUpdateCmd: configQ.data.update,
      original: {
        path: configQ.data.path,
        pattern: configQ.data.pattern,
        ignore: [...configQ.data.ignore],
      },
    } satisfies CollectionSettingsDraft;
  }, [configQ.data, showQ.data, draft, name]);

  const plan = settingsDraft ? planSettings(settingsDraft) : [];

  const contextQ = useQuery({
    queryKey: ["context"],
    queryFn: () =>
      apiFetch<{
        rows: Array<{ collection: string; path: string; text: string }>;
      }>("/api/context"),
    enabled: tab === "context",
  });
  const collContextRows =
    contextQ.data?.rows.filter((r) => r.collection === name) ?? [];

  const [ctxPath, setCtxPath] = useState("");
  const [ctxText, setCtxText] = useState("");

  function setTab(next: Tab) {
    setSearchParams({ tab: next }, { replace: true });
  }

  async function saveSettings() {
    if (!settingsDraft || !configQ.data || !plan.length) return;
    setSaving(true);
    try {
      await executeSettingsPlan(name, plan, configQ.data.baseHash, runJob);
      toast.success("Settings saved");
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["collection-config", name] });
      await queryClient.invalidateQueries({ queryKey: ["collection-show", name] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      await queryClient.invalidateQueries({ queryKey: ["status"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addContext(e: React.FormEvent) {
    e.preventDefault();
    const text = ctxText.trim();
    if (!text) return;
    const folder = ctxPath.replace(/^\/+|\/+$/g, "");
    const target = folder ? `${name}/${folder}` : `${name}/`;
    const job = await runJob("context.add", { path: target, text });
    if (job.exitCode !== 0) {
      toast.error(`context add failed (exit ${job.exitCode})`);
      return;
    }
    setCtxText("");
    setCtxPath("");
    await queryClient.invalidateQueries({ queryKey: ["context"] });
    toast.success("Context added");
  }

  if (!name) {
    return <p className="text-sm text-muted-foreground">Missing collection name.</p>;
  }

  return (
    <>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/collections" className="hover:text-foreground">Collections</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{name}</span>
      </nav>
      <PageHeader
        title={name}
        description={showQ.data?.path ?? row?.uri ?? ""}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {showQ.data && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs",
                  showQ.data.include
                    ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {showQ.data.include ? "In default search" : "Excluded"}
              </span>
            )}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={`/search?collections=${encodeURIComponent(name)}`}>Search here</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-border" role="tablist">
        {(
          [
            ["files", `Files (${row?.files ?? "…"})`],
            ["settings", "Settings"],
            ["context", `Context (${collContextRows.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px",
              tab === id
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "files" && (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Path inside collection</span>
            <div className="mt-1 flex">
              <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-2 font-mono text-xs">
                qmd://{name}/
              </span>
              <input
                className="h-10 min-w-0 flex-1 rounded-r-md border border-input bg-background px-3 font-mono text-sm"
                value={lsPrefix}
                onChange={(e) => setLsPrefix(e.target.value)}
                placeholder="docs"
              />
            </div>
          </label>
          <QueryState loading={filesQ.isLoading} error={filesQ.error}>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">File</th>
                    <th className="px-3 py-2 font-medium text-right">Size</th>
                    <th className="px-3 py-2 font-medium">Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filesQ.data?.files.map((f) => (
                    <tr
                      key={f.uri}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setDocTarget(`${name}/${f.path}`)}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{f.path}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {f.sizeBytes} B
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {f.modifiedLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QueryState>
        </div>
      )}

      {tab === "settings" && (
        <QueryState loading={configQ.isLoading || showQ.isLoading} error={configQ.error}>
          {settingsDraft && (
            <div className="mx-auto max-w-2xl space-y-6">
              <section className="rounded-lg border border-border p-4">
                <h2 className="font-medium">What gets indexed</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saved to index.yml, then <code className="font-mono text-xs">qmd update</code> when needed.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm">
                    <span className="font-medium">Folder path</span>
                    <input
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
                      value={settingsDraft.path}
                      onChange={(e) =>
                        setDraft({ ...settingsDraft, path: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium">Pattern</span>
                    <input
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
                      value={settingsDraft.pattern}
                      onChange={(e) =>
                        setDraft({ ...settingsDraft, pattern: e.target.value })
                      }
                    />
                  </label>
                  <div className="text-sm">
                    <span className="font-medium">Ignore</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {settingsDraft.ignore.map((g, i) => (
                        <span
                          key={g}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-xs"
                        >
                          {g}
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${g}`}
                            onClick={() =>
                              setDraft({
                                ...settingsDraft,
                                ignore: settingsDraft.ignore.filter((_, j) => j !== i),
                              })
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      className="mt-2 h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 font-mono text-sm"
                      placeholder="Archive/** then Enter"
                      value={ignoreInput}
                      onChange={(e) => setIgnoreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const g = ignoreInput.trim();
                        if (!g) return;
                        setDraft({
                          ...settingsDraft,
                          ignore: [...settingsDraft.ignore, g],
                        });
                        setIgnoreInput("");
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <h2 className="font-medium">Default search</h2>
                  <p className="text-sm text-muted-foreground">
                    qmd collection include / exclude
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settingsDraft.include}
                  className={cn(
                    "h-6 w-11 rounded-full transition-colors",
                    settingsDraft.include ? "bg-primary" : "bg-muted",
                  )}
                  onClick={() =>
                    setDraft({
                      ...settingsDraft,
                      include: !settingsDraft.include,
                    })
                  }
                />
              </section>

              <section className="rounded-lg border border-border p-4">
                <h2 className="font-medium">Before re-index command</h2>
                <input
                  className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
                  value={settingsDraft.updateCmd}
                  onChange={(e) =>
                    setDraft({ ...settingsDraft, updateCmd: e.target.value })
                  }
                  placeholder="git pull --ff-only"
                />
              </section>

              <section className="rounded-lg border border-border p-4">
                <h2 className="mb-3 font-medium">Will run</h2>
                <SettingsPlanPreview steps={plan} />
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!plan.length}
                    onClick={() => setDraft(null)}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    disabled={!plan.length || saving}
                    onClick={() => void saveSettings()}
                  >
                    {saving ? "Running…" : "Save and run"}
                  </Button>
                </div>
              </section>
            </div>
          )}
        </QueryState>
      )}

      {tab === "context" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Descriptions qmd attaches to results from this collection.
          </p>
          <QueryState loading={contextQ.isLoading} error={contextQ.error}>
            <ul className="divide-y rounded-lg border border-border">
              {collContextRows.map((row, i) => (
                <li key={i} className="px-4 py-3 text-sm">
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.path === "/" ? "(root)" : row.path}
                  </p>
                  <p className="mt-1">{row.text}</p>
                </li>
              ))}
            </ul>
          </QueryState>
          <form
            className="max-w-xl space-y-3 rounded-lg border border-border p-4"
            onSubmit={(e) => void addContext(e)}
          >
            <h2 className="font-medium">Add context</h2>
            <label className="block text-sm">
              <span className="font-medium">Folder inside collection (optional)</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
                value={ctxPath}
                onChange={(e) => setCtxPath(e.target.value)}
                placeholder="docs/api"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Description</span>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={ctxText}
                onChange={(e) => setCtxText(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={!ctxText.trim()}>Add context</Button>
          </form>
        </div>
      )}

      <DocDrawer target={docTarget} onClose={() => setDocTarget(null)} />
    </>
  );
}
