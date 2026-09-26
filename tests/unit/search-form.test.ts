import { describe, expect, it } from "vitest";
import {
  buildSearchJobOpts,
  defaultSearchForm,
  previewSearchArgv,
} from "../../src/web/lib/search-form.js";

describe("search form", () => {
  it("preview matches job opts argv", () => {
    const state = {
      ...defaultSearchForm(),
      mode: "search" as const,
      query: "auth",
      n: "5",
    };
    const opts = buildSearchJobOpts(state);
    const argv = previewSearchArgv(state);
    expect(argv).toContain("--");
    expect(argv).toContain("auth");
    expect(opts.query).toBe("auth");
  });

  it("rejects empty typed lines", () => {
    expect(() =>
      buildSearchJobOpts({
        ...defaultSearchForm(),
        mode: "query",
        useTypedQuery: true,
        typedLines: [{ type: "lex", query: "  " }],
      }),
    ).toThrow(/typed query/i);
  });
});
