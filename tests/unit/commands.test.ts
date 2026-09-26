import { describe, expect, it } from "vitest";
import { buildJobArgv, buildSearchArgv } from "../../src/shared/commands.js";

describe("buildSearchArgv", () => {
  it("places free text after --", () => {
    expect(buildSearchArgv("search", { query: "-docker" })).toEqual([
      "search",
      "--format",
      "json",
      "--",
      "-docker",
    ]);
  });

  it("gates query-only flags", () => {
    const argv = buildSearchArgv("query", {
      query: "auth",
      noRerank: true,
      candidateLimit: 10,
      intent: "login flow",
    });
    expect(argv).toContain("--no-rerank");
    expect(argv).toContain("-C");
    expect(argv).toContain("--intent");
  });

  it("omits no-rerank for keyword search", () => {
    const argv = buildSearchArgv("search", { query: "x", noRerank: true });
    expect(argv).not.toContain("--no-rerank");
  });

  it("builds dollar-quoted typed query", () => {
    const argv = buildSearchArgv("query", {
      typedLines: [
        { type: "lex", query: "error" },
        { type: "vec", query: "failure handling" },
      ],
    });
    expect(argv.at(-1)).toMatch(/^\$'/);
    expect(argv.at(-2)).toBe("--");
  });

  it("rejects intent-only typed query", () => {
    expect(() =>
      buildSearchArgv("query", {
        typedLines: [],
        intent: "only",
      }),
    ).toThrow();
  });
});

describe("buildJobArgv", () => {
  it("collection update-cmd uses -- before shell", () => {
    expect(
      buildJobArgv("collection.updateCmd", {
        name: "notes",
        cmd: "git pull",
      }),
    ).toEqual(["collection", "update-cmd", "notes", "--", "git pull"]);
  });

  it("context add uses -- before text", () => {
    expect(
      buildJobArgv("context.add", { path: "/", text: "global hint" }),
    ).toEqual(["context", "add", "/", "--", "global hint"]);
  });

  it("embed passes collection and force", () => {
    expect(
      buildJobArgv("embed", { collection: "notes", force: true }),
    ).toEqual(["embed", "-f", "-c", "notes"]);
  });

  it("mcp start includes http daemon flags", () => {
    expect(buildJobArgv("mcp.start", { port: 8181 })).toEqual([
      "mcp",
      "--http",
      "--daemon",
      "--port",
      "8181",
    ]);
  });
});
