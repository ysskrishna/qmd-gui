import { buildSearchArgv } from "@shared/commands.js";
import type { SearchMode, TypedQueryLine } from "@shared/types.js";
import { isSearchFieldEnabled } from "@shared/search-gating.js";

export type SearchFormState = {
  mode: SearchMode;
  query: string;
  useTypedQuery: boolean;
  typedLines: TypedQueryLine[];
  intent: string;
  collections: string[];
  n: string;
  minScore: string;
  all: boolean;
  candidateLimit: string;
  noRerank: boolean;
  explain: boolean;
  full: boolean;
  fullPath: boolean;
};

export const defaultSearchForm = (): SearchFormState => ({
  mode: "query",
  query: "",
  useTypedQuery: false,
  typedLines: [
    { type: "lex", query: "" },
    { type: "vec", query: "" },
  ],
  intent: "",
  collections: [],
  n: "",
  minScore: "",
  all: false,
  candidateLimit: "",
  noRerank: false,
  explain: false,
  full: false,
  fullPath: false,
});

export function buildSearchJobOpts(state: SearchFormState): Record<string, unknown> {
  const mode = state.mode;
  const opts: Record<string, unknown> = { mode };

  if (state.useTypedQuery && isSearchFieldEnabled(mode, "typedQuery")) {
    const typedLines = state.typedLines.filter((l) => l.query.trim());
    if (!typedLines.length) throw new Error("Add at least one typed query line");
    opts.typedLines = typedLines;
    if (state.intent.trim() && isSearchFieldEnabled(mode, "intent")) {
      opts.intent = state.intent.trim();
    }
  } else {
    if (!state.query.trim()) throw new Error("Enter a search query");
    opts.query = state.query.trim();
    if (state.intent.trim() && isSearchFieldEnabled(mode, "intent")) {
      opts.intent = state.intent.trim();
    }
  }

  if (state.collections.length) opts.collections = state.collections;
  if (state.n.trim()) opts.n = Number(state.n);
  if (state.minScore.trim()) opts.minScore = Number(state.minScore);
  if (state.all) opts.all = true;
  if (
    state.candidateLimit.trim() &&
    isSearchFieldEnabled(mode, "candidateLimit")
  ) {
    opts.candidateLimit = Number(state.candidateLimit);
  }
  if (state.noRerank && isSearchFieldEnabled(mode, "noRerank")) {
    opts.noRerank = true;
  }
  if (state.explain && isSearchFieldEnabled(mode, "explain")) opts.explain = true;
  if (state.full) opts.full = true;
  if (state.fullPath) opts.fullPath = true;

  return opts;
}

export function previewSearchArgv(state: SearchFormState): string[] {
  return buildSearchArgv(state.mode, buildSearchJobOpts(state) as Parameters<
    typeof buildSearchArgv
  >[1]);
}
