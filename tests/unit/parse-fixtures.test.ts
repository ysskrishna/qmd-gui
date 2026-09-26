import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCollectionList } from "../../src/server/qmd/parse/collection-list.js";
import { parseCollectionShow } from "../../src/server/qmd/parse/collection-show.js";
import { parseContextList } from "../../src/server/qmd/parse/context-list.js";
import { parseGet } from "../../src/server/qmd/parse/get.js";
import { parseLs } from "../../src/server/qmd/parse/ls.js";
import { parseSearchJson } from "../../src/server/qmd/parse/search.js";
import { parseStatus } from "../../src/server/qmd/parse/status.js";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "qmd-2.8.3",
);

async function load(name: string) {
  return readFile(path.join(fixtureDir, name), "utf8");
}

describe("qmd output parsers (2.8.3 fixtures)", () => {
  it("parseStatus reads pending as need embedding count", async () => {
    const s = parseStatus(await load("status.txt"));
    expect(s.dbPath).toContain("index.sqlite");
    expect(s.pendingEmbeddings).toBe(1);
    expect(s.totalFiles).toBe(1);
    expect(s.tips.length).toBeGreaterThan(0);
    expect(s.collections[0]?.name).toBe("demo");
  });

  it("parseCollectionList", async () => {
    const rows = parseCollectionList(await load("collection-list.txt"));
    expect(rows[0]).toMatchObject({ name: "demo", files: 1, excluded: false });
  });

  it("parseCollectionShow", async () => {
    const show = parseCollectionShow(await load("collection-show-demo.txt"));
    expect(show.name).toBe("demo");
    expect(show.include).toBe(true);
  });

  it("parseContextList", async () => {
    const rows = parseContextList(await load("context-list.txt"));
    expect(rows[0]).toMatchObject({
      collection: "demo",
      path: "/",
      text: "Fixture collection context",
    });
  });

  it("parseLs", async () => {
    const files = parseLs(await load("ls-demo.txt"));
    expect(files[0]?.uri).toBe("qmd://demo/readme.md");
  });

  it("parseGet", async () => {
    const doc = parseGet(await load("get-readme.txt"));
    expect(doc.docid).toBe("#129047");
    expect(doc.lines[0]?.text).toContain("Hello fixture");
  });

  it("parseSearchJson strips snippet hunk header", async () => {
    const hits = parseSearchJson(await load("search-sample.json"));
    expect(hits[0]?.snippetLine).toBe(1);
    expect(hits[0]?.snippet).not.toMatch(/^@@/);
  });
});
