import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CommandPreview } from "@/components/CommandPreview";
import { DocDrawer } from "@/components/DocDrawer";
import { OpenDocDialog } from "@/components/OpenDocDialog";
import { PageHeader } from "@/components/PageHeader";
import { SearchResults } from "@/components/search/SearchResults";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import {
  buildSearchJobOpts,
  defaultSearchForm,
  previewSearchArgv,
  type SearchFormState,
} from "@/lib/search-form.js";
import { fetchCollections, fetchStatus } from "@/lib/queries.js";
import { isSearchFieldEnabled } from "@shared/search-gating.js";
import type { SearchHit, SearchMode, TypedQueryLine } from "@shared/types.js";
import { cn } from "@/lib/utils";

const MODES: Array<{ id: SearchMode; label: string; hint: string }> = [
  { id: "search", label: "Keyword", hint: "BM25 — exact words, no models" },
  { id: "vsearch", label: "Vector", hint: "Meaning-based similarity" },
  { id: "query", label: "Hybrid", hint: "Recommended — fuses keyword + vector" },
];

export function SearchPage() {
  const [form, setForm] = useState<SearchFormState>(defaultSearchForm);
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [docTarget, setDocTarget] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searching, setSearching] = useState(false);
  const { runJob } = useActivity();

  const statusQ = useQuery({ queryKey: ["status"], queryFn: fetchStatus });
  const colsQ = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  const previewArgv = useMemo(() => {
    try {
      return previewSearchArgv(form);
    } catch {
      return [form.mode, "--format", "json", "--", "<query>"];
    }
  }, [form]);

  const pending = statusQ.data?.pendingEmbeddings ?? 0;
  const collections = colsQ.data?.collections ?? [];

  function patch<K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCollection(name: string) {
    setForm((f) => {
      const has = f.collections.includes(name);
      return {
        ...f,
        collections: has
          ? f.collections.filter((c) => c !== name)
          : [...f.collections, name],
      };
    });
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    try {
      const opts = buildSearchJobOpts(form);
      setSearching(true);
      setResults(null);
      const job = await runJob(form.mode, opts);
      if (job.exitCode !== 0) {
        toast.error(`Search failed (exit ${job.exitCode})`);
        return;
      }
      setResults(Array.isArray(job.result) ? (job.result as SearchHit[]) : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function openHit(hit: SearchHit) {
    const path = hit.file.replace(/^qmd:\/\/[^/]+\//, "");
    setDocTarget(path || hit.docid);
  }

  const mode = form.mode;

  return (
    <>
      <PageHeader
        title="Search"
        description={
          <>
            Runs <code className="font-mono text-xs">qmd {mode}</code> with JSON
            results. Click a hit to open <code className="font-mono text-xs">qmd get</code>.
          </>
        }
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setOpenDialog(true)}>
            Open by path
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cn(
              "rounded-[10px] border border-border bg-card px-3 py-3 text-left",
              mode === m.id && "border-primary ring-1 ring-primary",
            )}
            aria-pressed={mode === m.id}
            onClick={() => patch("mode", m.id)}
          >
            <div className="flex items-center justify-between gap-2 font-medium">
              {m.label}
              <code className="text-[11px] text-muted-foreground">{m.id}</code>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
          </button>
        ))}
      </div>

      {pending > 0 && mode !== "search" && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <span>
            <strong>{pending}</strong> documents need embeddings —{" "}
            {MODES.find((m) => m.id === mode)?.label} search may miss them until you run{" "}
            <code className="font-mono text-xs">qmd embed</code>.
          </span>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link to="/index">Go to Index</Link>
          </Button>
        </div>
      )}

      <form className="space-y-4" onSubmit={(e) => void onSearch(e)}>
        <div className="flex gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-[10px] border border-input bg-card px-3 text-[15px]"
            value={form.query}
            onChange={(e) => patch("query", e.target.value)}
            placeholder={
              mode === "search"
                ? "exact words…"
                : mode === "vsearch"
                  ? "meaning-based query…"
                  : "how does auth work…"
            }
            disabled={form.useTypedQuery && isSearchFieldEnabled(mode, "typedQuery")}
            aria-label="Query"
          />
          <Button type="submit" className="h-11" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !form.collections.length
                ? "border-primary bg-primary/10"
                : "border-border",
            )}
            onClick={() => patch("collections", [])}
          >
            Default
          </button>
          {collections.map((c) => {
            const selected = form.collections.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  selected && "border-primary",
                  c.excluded && "border-dashed opacity-80",
                )}
                onClick={() => toggleCollection(c.name)}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium">Results (-n)</span>
            <input
              type="number"
              min={1}
              className="mt-1 h-9 w-full rounded-md border border-input px-2"
              value={form.n}
              onChange={(e) => patch("n", e.target.value)}
              disabled={form.all}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Min score</span>
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              className="mt-1 h-9 w-full rounded-md border border-input px-2"
              value={form.minScore}
              onChange={(e) => patch("minScore", e.target.value)}
              placeholder={mode === "vsearch" ? "0.3" : "0"}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.all}
              onChange={(e) => patch("all", e.target.checked)}
            />
            All matches (--all)
          </label>
        </div>

        <details className="rounded-lg border border-border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">More options</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Intent (--intent)
              <input
                className="mt-1 h-9 w-full rounded-md border border-input px-2"
                value={form.intent}
                onChange={(e) => patch("intent", e.target.value)}
                disabled={!isSearchFieldEnabled(mode, "intent")}
              />
            </label>
            <label className="text-sm">
              Candidate limit (-C)
              <input
                type="number"
                className="mt-1 h-9 w-full rounded-md border border-input px-2"
                value={form.candidateLimit}
                onChange={(e) => patch("candidateLimit", e.target.value)}
                disabled={!isSearchFieldEnabled(mode, "candidateLimit")}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.noRerank}
                onChange={(e) => patch("noRerank", e.target.checked)}
                disabled={!isSearchFieldEnabled(mode, "noRerank")}
              />
              Skip rerank (--no-rerank)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.explain}
                onChange={(e) => patch("explain", e.target.checked)}
                disabled={!isSearchFieldEnabled(mode, "explain")}
              />
              Explain scores (--explain)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.full}
                onChange={(e) => patch("full", e.target.checked)}
              />
              Full documents (--full)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.fullPath}
                onChange={(e) => patch("fullPath", e.target.checked)}
              />
              On-disk paths (--full-path)
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.useTypedQuery}
                onChange={(e) => patch("useTypedQuery", e.target.checked)}
                disabled={!isSearchFieldEnabled(mode, "typedQuery")}
              />
              Advanced typed query (lex / vec / hyde)
            </label>
          </div>
          {form.useTypedQuery && isSearchFieldEnabled(mode, "typedQuery") && (
            <div className="mt-3 space-y-2">
              {form.typedLines.map((line, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={line.type}
                    onChange={(e) => {
                      const typedLines = [...form.typedLines];
                      typedLines[i] = {
                        ...line,
                        type: e.target.value as TypedQueryLine["type"],
                      };
                      patch("typedLines", typedLines);
                    }}
                  >
                    <option value="lex">lex</option>
                    <option value="vec">vec</option>
                    <option value="hyde">hyde</option>
                  </select>
                  <input
                    className="h-9 rounded-md border border-input px-2 text-sm"
                    value={line.query}
                    onChange={(e) => {
                      const typedLines = [...form.typedLines];
                      typedLines[i] = { ...line, query: e.target.value };
                      patch("typedLines", typedLines);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </details>

        <CommandPreview argv={previewArgv} />
      </form>

      {results && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">
            Results ({results.length})
          </h2>
          <SearchResults
            hits={results}
            explain={form.explain}
            onOpen={openHit}
            query={form.query}
          />
        </div>
      )}

      <DocDrawer target={docTarget} onClose={() => setDocTarget(null)} />
      <OpenDocDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onOpen={(t) => setDocTarget(t)}
      />
    </>
  );
}
