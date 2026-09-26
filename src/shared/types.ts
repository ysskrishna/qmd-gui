export type JobKind =
  | "search"
  | "vsearch"
  | "query"
  | "collection.add"
  | "collection.remove"
  | "collection.rename"
  | "collection.include"
  | "collection.exclude"
  | "collection.updateCmd"
  | "context.add"
  | "context.rm"
  | "update"
  | "embed"
  | "pull"
  | "cleanup"
  | "cleanupDry"
  | "doctor"
  | "mcp.start"
  | "mcp.stop"
  | "skill.install";

export type SearchMode = "search" | "vsearch" | "query";

export type TypedQueryLine = {
  type: "lex" | "vec" | "hyde";
  query: string;
};

export type JobPostBody = {
  kind: JobKind;
  opts: Record<string, unknown>;
};

export type SearchHit = {
  docid: string;
  score: number;
  file: string;
  line: number;
  title: string;
  context: string;
  snippet: string;
  snippetLine: number | null;
  explain?: unknown;
};

export type JobSummary = {
  id: string;
  kind: JobKind;
  argv: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
};
