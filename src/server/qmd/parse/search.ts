import type { SearchHit } from "../../../shared/types.js";

export type { SearchHit };

const SNIPPET_HUNK_RE = /^@@\s+-(\d+),/;

export function parseSearchJson(stdout: string): SearchHit[] {
  const raw = JSON.parse(stdout) as Array<Record<string, unknown>>;
  return raw.map((row) => {
    const snippet = String(row.snippet ?? "");
    const hunk = SNIPPET_HUNK_RE.exec(snippet);
    const cleaned = snippet.replace(/^@@\s+-\d+,\d+\s+@@\s+\([^)]+\)\n?/, "");
    return {
      docid: String(row.docid ?? ""),
      score: Number(row.score ?? 0),
      file: String(row.file ?? ""),
      line: Number(row.line ?? 0),
      title: String(row.title ?? ""),
      context: String(row.context ?? ""),
      snippet: cleaned,
      snippetLine: hunk ? Number(hunk[1]) : null,
      explain: row.explain,
    };
  });
}
