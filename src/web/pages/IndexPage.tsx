import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CommandPreview } from "@/components/CommandPreview";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useActivity } from "@/context/activity";
import { Button } from "@/components/ui/button";
import { modelHref, modelLabel } from "@/lib/model-links.js";
import {
  fetchCollections,
  fetchStatus,
  fetchSystem,
} from "@/lib/queries.js";
import { buildJobArgv } from "@shared/commands.js";
import type { EmbedOpts, PullOpts } from "@shared/commands.js";
import { cn } from "@/lib/utils";

export function IndexPage() {
  const q = useQuery({ queryKey: ["status"], queryFn: fetchStatus });
  const systemQ = useQuery({ queryKey: ["system"], queryFn: fetchSystem });
  const colsQ = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const queryClient = useQueryClient();
  const { runJob } = useActivity();

  const [embedColl, setEmbedColl] = useState("");
  const [embedForce, setEmbedForce] = useState(false);
  const [embedTimeout, setEmbedTimeout] = useState("");
  const [embedBatch, setEmbedBatch] = useState("");
  const [pullRefresh, setPullRefresh] = useState(false);
  const [cleanupReady, setCleanupReady] = useState(false);
  const [doctorLines, setDoctorLines] = useState<string[] | null>(null);

  const embedOpts = useMemo((): EmbedOpts => {
    const o: EmbedOpts = {};
    if (embedColl) o.collection = embedColl;
    if (embedForce) o.force = true;
    const t = Number(embedTimeout);
    if (embedTimeout.trim() && Number.isFinite(t)) o.timeoutMin = t;
    const b = Number(embedBatch);
    if (embedBatch.trim() && Number.isFinite(b)) o.maxDocsPerBatch = b;
    return o;
  }, [embedColl, embedForce, embedTimeout, embedBatch]);

  const pullOpts: PullOpts = { refresh: pullRefresh };

  const noContext =
    q.data?.collections.filter((c) => c.contextCount === 0).map((c) => c.name) ??
    [];
  const collectionCount = colsQ.data?.collections.length ?? q.data?.collections.length ?? 0;

  async function runMaintenance(
    kind: Parameters<typeof runJob>[0],
    opts: Record<string, unknown>,
    onSuccess?: () => void,
  ) {
    const job = await runJob(kind, opts);
    if (job.exitCode !== 0) {
      toast.error(`Command failed (exit ${job.exitCode})`);
      return;
    }
    onSuccess?.();
    await queryClient.invalidateQueries({ queryKey: ["status"] });
    toast.success("Done");
  }

  return (
    <>
      <PageHeader
        title="Index"
        description={
          q.data?.dbPath
            ? `Health and upkeep for ${q.data.dbPath}. Numbers from qmd status.`
            : "Health and upkeep. Numbers from qmd status."
        }
      />
      <QueryState loading={q.isLoading} error={q.error}>
        {q.data && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Files indexed"
                value={String(q.data.totalFiles)}
                sub={`${collectionCount} collections · ${q.data.sizeLabel ?? "—"}`}
              />
              <Stat
                label="Vectors embedded"
                value={String(q.data.vectors)}
                sub={q.data.updatedLabel ? `Updated ${q.data.updatedLabel}` : undefined}
              />
              <Stat
                label="Need embedding"
                value={String(q.data.pendingEmbeddings)}
                sub={
                  q.data.pendingEmbeddings
                    ? "Hybrid and vector search miss these"
                    : "All caught up"
                }
                warn={q.data.pendingEmbeddings > 0}
              />
            </div>

            {(q.data.tips.length > 0 || noContext.length > 0) && (
              <section className="mt-6 rounded-lg border border-border p-4">
                <h2 className="font-medium">Tips from qmd status</h2>
                <ul className="mt-3 space-y-2">
                  {q.data.tips.map((tip) => (
                    <li
                      key={tip}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>{tip}</span>
                      {/embed/i.test(tip) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void runMaintenance("embed", embedOpts)}
                        >
                          Run embed
                        </Button>
                      )}
                    </li>
                  ))}
                  {noContext.length > 0 && (
                    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        Add context for better results:{" "}
                        <strong>{noContext.join(", ")}</strong>
                      </span>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link to="/context">Add context</Link>
                      </Button>
                    </li>
                  )}
                </ul>
              </section>
            )}

            <section className="mt-6 rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-medium">Maintenance</h2>
                <p className="text-sm text-muted-foreground">
                  Each action runs the command below. Output streams into Activity.
                </p>
              </div>
              <div className="divide-y divide-border">
                <MaintenanceRow
                  title="Re-index all collections"
                  description="Finds new, changed and deleted files. Runs each collection's before re-index command first."
                  argv={buildJobArgv("update", {})}
                  onRun={() => void runMaintenance("update", {})}
                />
                <MaintenanceRow
                  title="Generate embeddings"
                  description="Creates vectors for documents that need them."
                  argv={buildJobArgv("embed", embedOpts)}
                  onRun={() => void runMaintenance("embed", embedOpts)}
                >
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Collection (-c)</span>
                      <select
                        className="mt-1 h-9 rounded-md border border-input bg-background px-2"
                        value={embedColl}
                        onChange={(e) => setEmbedColl(e.target.value)}
                      >
                        <option value="">All collections</option>
                        {colsQ.data?.collections.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Timeout (min)</span>
                      <input
                        type="number"
                        min={0}
                        className="mt-1 h-9 w-28 rounded-md border border-input bg-background px-2"
                        value={embedTimeout}
                        onChange={(e) => setEmbedTimeout(e.target.value)}
                        placeholder="30"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Docs / batch</span>
                      <input
                        type="number"
                        min={1}
                        className="mt-1 h-9 w-28 rounded-md border border-input bg-background px-2"
                        value={embedBatch}
                        onChange={(e) => setEmbedBatch(e.target.value)}
                      />
                    </label>
                    <label className="flex items-end gap-2 pb-1">
                      <input
                        type="checkbox"
                        checked={embedForce}
                        onChange={(e) => setEmbedForce(e.target.checked)}
                      />
                      <span>Re-embed everything (-f)</span>
                    </label>
                  </div>
                </MaintenanceRow>
                <MaintenanceRow
                  title="Download models"
                  description="Fetches embedding, reranking and query-expansion models."
                  argv={buildJobArgv("pull", pullOpts)}
                  onRun={() => void runMaintenance("pull", pullOpts)}
                >
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pullRefresh}
                      onChange={(e) => setPullRefresh(e.target.checked)}
                    />
                    Re-download even if cached (--refresh)
                  </label>
                </MaintenanceRow>
                <MaintenanceRow
                  title="Clean up database"
                  description="Drops cached responses, orphaned vectors, then vacuums. Preview first."
                  argv={
                    cleanupReady
                      ? buildJobArgv("cleanup", {})
                      : buildJobArgv("cleanupDry", {})
                  }
                  actions={
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void runMaintenance("cleanupDry", {}, () =>
                            setCleanupReady(true),
                          )
                        }
                      >
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!cleanupReady}
                        title={cleanupReady ? undefined : "Run preview first"}
                        onClick={() => void runMaintenance("cleanup", {})}
                      >
                        Clean up
                      </Button>
                    </div>
                  }
                />
                <MaintenanceRow
                  title="Run diagnostics"
                  description="Checks SQLite, models, GPU and embedding consistency."
                  argv={buildJobArgv("doctor", {})}
                  onRun={async () => {
                    const job = await runJob("doctor", {});
                    setDoctorLines(job.lines.map((l) => l.line));
                    if (job.exitCode !== 0) {
                      toast.error(`Doctor failed (exit ${job.exitCode})`);
                    }
                  }}
                />
              </div>
            </section>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-lg border border-border p-4">
                <h2 className="font-medium">Models</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {(["embed", "rerank", "generate"] as const).map((key) => {
                    const val = q.data.models[key];
                    const label =
                      key === "embed"
                        ? "Embedding"
                        : key === "rerank"
                          ? "Reranking"
                          : "Query expansion";
                    return (
                      <div key={key} className="grid grid-cols-[7rem_1fr] gap-2">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 truncate font-mono text-xs">
                          {val ? (
                            <a
                              href={modelHref(val)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {modelLabel(val)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
              <section className="rounded-lg border border-border p-4">
                <h2 className="font-medium">Index details</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <Detail label="Database" value={q.data.dbPath ?? "—"} mono />
                  <Detail
                    label="Config"
                    value={systemQ.data?.configPath ?? "—"}
                    mono
                  />
                  <Detail label="Size" value={q.data.sizeLabel ?? "—"} />
                  <Detail
                    label="Orphaned vectors"
                    value={
                      q.data.orphanedVectors != null
                        ? String(q.data.orphanedVectors)
                        : "None"
                    }
                  />
                  <Detail
                    label="AST chunking"
                    value={
                      q.data.astActive
                        ? `Active · ${q.data.astLanguages.join(", ") || "—"}`
                        : "Inactive"
                    }
                  />
                  <Detail
                    label="MCP server"
                    value={
                      q.data.mcpPid
                        ? `Running (PID ${q.data.mcpPid})`
                        : "Not running"
                    }
                  />
                </dl>
              </section>
            </div>

            {doctorLines && doctorLines.length > 0 && (
              <section className="mt-6 rounded-lg border border-border p-4">
                <h2 className="font-medium">Last diagnostics</h2>
                <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                  {doctorLines.join("\n")}
                </pre>
              </section>
            )}
          </>
        )}
      </QueryState>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border px-4 py-3",
        warn && "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-all", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}

function MaintenanceRow({
  title,
  description,
  argv,
  onRun,
  actions,
  children,
}: {
  title: string;
  description: string;
  argv: string[];
  onRun?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {children}
        </div>
        {actions ?? (
          <Button type="button" size="sm" onClick={onRun}>
            Run
          </Button>
        )}
      </div>
      <CommandPreview argv={argv} className="mt-3" />
    </div>
  );
}
