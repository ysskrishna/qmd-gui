import { describe, expect, it } from "vitest";
import { isSearchFieldEnabled } from "../../src/shared/search-gating.js";

describe("isSearchFieldEnabled", () => {
  it("gates hybrid-only fields", () => {
    expect(isSearchFieldEnabled("search", "explain")).toBe(false);
    expect(isSearchFieldEnabled("query", "explain")).toBe(true);
    expect(isSearchFieldEnabled("vsearch", "intent")).toBe(true);
    expect(isSearchFieldEnabled("search", "intent")).toBe(false);
    expect(isSearchFieldEnabled("query", "noRerank")).toBe(true);
    expect(isSearchFieldEnabled("vsearch", "typedQuery")).toBe(false);
  });
});
