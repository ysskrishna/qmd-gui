import type { SearchHit } from "@shared/types.js";

export type ResultHit = SearchHit;

type Props = {
  hits: ResultHit[];
  explain: boolean;
  onOpen: (hit: ResultHit) => void;
  query: string;
};

export function SearchResults({ hits, explain, onOpen, query }: Props) {
  if (!hits.length) {
    return (
      <p className="text-sm text-muted-foreground">No results.</p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border border-border">
      {hits.map((hit, i) => (
        <li key={`${hit.docid}-${i}`}>
          <button
            type="button"
            className="w-full px-4 py-3 text-left hover:bg-muted/50"
            onClick={() => onOpen(hit)}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{hit.title || "Untitled"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {hit.docid}
              </span>
              <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                score {formatScore(hit.score)}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {hit.file}
              {hit.line ? `:${hit.line}` : ""}
              {hit.snippetLine ? ` (snippet line ${hit.snippetLine})` : ""}
            </p>
            {hit.context && (
              <p className="mt-1 text-xs text-muted-foreground">{hit.context}</p>
            )}
            <p
              className="mt-2 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: highlightSnippet(hit.snippet, query),
              }}
            />
            {explain && hit.explain != null ? (
              <ExplainBlock explain={hit.explain} />
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(4);
}

function highlightSnippet(snippet: string, query: string) {
  const esc = snippet
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const q = query.trim();
  if (!q || q.length < 2) return esc;
  try {
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return esc.replace(re, "<mark class='bg-amber-200/80 dark:bg-amber-900/50'>$1</mark>");
  } catch {
    return esc;
  }
}

function ExplainBlock({ explain }: { explain: unknown }) {
  const e = explain as {
    blendedScore?: number;
    rerankScore?: number;
    rrf?: { totalScore?: number; contributions?: Array<Record<string, unknown>> };
  };
  const rows = e.rrf?.contributions ?? [];
  return (
    <div className="mt-3 overflow-x-auto rounded border border-border text-xs">
      <table className="w-full text-left">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1">source</th>
            <th className="px-2 py-1">query</th>
            <th className="px-2 py-1">rank</th>
            <th className="px-2 py-1">rrf</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1 font-mono">{String(row.source ?? "")}</td>
              <td className="px-2 py-1">{String(row.query ?? "")}</td>
              <td className="px-2 py-1 tabular-nums">{String(row.rank ?? "")}</td>
              <td className="px-2 py-1 tabular-nums">
                {String(row.rrfContribution ?? "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(e.blendedScore !== undefined || e.rerankScore !== undefined) && (
        <p className="border-t border-border px-2 py-1 text-muted-foreground">
          {e.rerankScore !== undefined && `rerank ${e.rerankScore} · `}
          {e.blendedScore !== undefined && `blended ${e.blendedScore}`}
        </p>
      )}
    </div>
  );
}
