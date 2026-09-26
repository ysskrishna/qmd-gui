import type { SearchMode } from "./types.js";

export type SearchField =
  | "intent"
  | "candidateLimit"
  | "noRerank"
  | "explain"
  | "full"
  | "fullPath"
  | "typedQuery";

export function isSearchFieldEnabled(
  mode: SearchMode,
  field: SearchField,
): boolean {
  switch (field) {
    case "intent":
      return mode === "query" || mode === "vsearch";
    case "candidateLimit":
    case "noRerank":
    case "explain":
    case "typedQuery":
      return mode === "query";
    case "full":
    case "fullPath":
      return true;
    default:
      return false;
  }
}
