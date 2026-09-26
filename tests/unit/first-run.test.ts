import { describe, expect, it } from "vitest";
import {
  qmdRecoveryCommands,
  resolveFirstRunStep,
  resolveHardAvailabilityStep,
} from "../../src/web/pages/FirstRun";

const healthySystem = {
  qmdFound: true,
  version: "2.8.3",
  supported: true,
  configPath: "",
  dbPath: null,
  guiPort: 8765,
  platform: "darwin" as const,
};

describe("resolveHardAvailabilityStep", () => {
  it("detects connection failure", () => {
    expect(resolveHardAvailabilityStep(undefined, true)).toBe("connection-error");
  });

  it("detects missing qmd only with positive API data", () => {
    expect(
      resolveHardAvailabilityStep(
        {
          qmdFound: false,
          version: null,
          supported: false,
          configPath: "",
          dbPath: null,
          guiPort: null,
          platform: "linux",
        },
        false,
      ),
    ).toBe("missing-qmd");
    expect(resolveHardAvailabilityStep(undefined, false)).toBe("connection-error");
  });

  it("detects unsupported version", () => {
    expect(
      resolveHardAvailabilityStep(
        {
          qmdFound: true,
          version: "2.0.0",
          supported: false,
          configPath: "",
          dbPath: null,
          guiPort: null,
          platform: "linux",
        },
        false,
      ),
    ).toBe("unsupported");
  });
});

describe("resolveFirstRunStep", () => {
  it("detects missing qmd", () => {
    expect(
      resolveFirstRunStep(
        {
          qmdFound: false,
          version: null,
          supported: false,
          configPath: "",
          dbPath: null,
          guiPort: null,
          platform: "linux",
        },
        undefined,
        undefined,
        false,
      ),
    ).toBe("missing-qmd");
  });

  it("detects unsupported version", () => {
    expect(
      resolveFirstRunStep(
        {
          qmdFound: true,
          version: "2.0.0",
          supported: false,
          configPath: "",
          dbPath: null,
          guiPort: null,
          platform: "linux",
        },
        undefined,
        { collections: [] },
        false,
      ),
    ).toBe("unsupported");
  });

  it("detects empty collections", () => {
    expect(
      resolveFirstRunStep(
        healthySystem,
        {
          pendingEmbeddings: 0,
          totalFiles: 0,
          models: { embed: "x" },
          dbPath: null,
          sizeLabel: null,
          vectors: 0,
          orphanedVectors: null,
          updatedLabel: null,
          mcpPid: null,
          astActive: false,
          astLanguages: [],
          tips: [],
          collections: [],
        },
        { collections: [] },
        false,
      ),
    ).toBe("no-collections");
  });

  it("detects pending embeddings", () => {
    expect(
      resolveFirstRunStep(
        healthySystem,
        {
          pendingEmbeddings: 3,
          totalFiles: 10,
          models: { embed: "x" },
          dbPath: null,
          sizeLabel: null,
          vectors: 0,
          orphanedVectors: null,
          updatedLabel: null,
          mcpPid: null,
          astActive: false,
          astLanguages: [],
          tips: [],
          collections: [],
        },
        { collections: [{ name: "a", excluded: false }] },
        false,
      ),
    ).toBe("needs-embed");
  });
});

describe("qmdRecoveryCommands", () => {
  it("uses Windows commands on win32", () => {
    expect(qmdRecoveryCommands("win32")).toContain("where.exe qmd");
  });

  it("uses POSIX commands elsewhere", () => {
    expect(qmdRecoveryCommands("darwin")).toContain("command -v qmd");
  });
});
