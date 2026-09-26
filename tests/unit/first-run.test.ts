import { describe, expect, it } from "vitest";
import { resolveFirstRunStep } from "../../src/web/pages/FirstRun";

describe("resolveFirstRunStep", () => {
  it("detects missing qmd", () => {
    expect(
      resolveFirstRunStep(
        { qmdFound: false, version: null, supported: false, configPath: "", dbPath: null },
        undefined,
        undefined,
        false,
      ),
    ).toBe("missing-qmd");
  });

  it("detects unsupported version", () => {
    expect(
      resolveFirstRunStep(
        { qmdFound: true, version: "2.0.0", supported: false, configPath: "", dbPath: null },
        undefined,
        { collections: [] },
        false,
      ),
    ).toBe("unsupported");
  });

  it("detects empty collections", () => {
    expect(
      resolveFirstRunStep(
        { qmdFound: true, version: "2.8.3", supported: true, configPath: "", dbPath: null },
        { pendingEmbeddings: 0, totalFiles: 0, models: { embed: "x" }, dbPath: null, sizeLabel: null },
        { collections: [] },
        false,
      ),
    ).toBe("no-collections");
  });

  it("detects pending embeddings", () => {
    expect(
      resolveFirstRunStep(
        { qmdFound: true, version: "2.8.3", supported: true, configPath: "", dbPath: null },
        { pendingEmbeddings: 3, totalFiles: 10, models: { embed: "x" }, dbPath: null, sizeLabel: null },
        { collections: [{ name: "a", excluded: false }] },
        false,
      ),
    ).toBe("needs-embed");
  });
});
