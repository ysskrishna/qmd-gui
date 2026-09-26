import { describe, expect, it } from "vitest";
import {
  planSettings,
  type CollectionSettingsDraft,
} from "../../src/shared/plan-settings.js";

function draft(
  overrides: Partial<CollectionSettingsDraft> = {},
): CollectionSettingsDraft {
  return {
    name: "notes",
    include: true,
    wasIncluded: true,
    path: "/data/notes",
    pattern: "**/*.md",
    ignore: [],
    updateCmd: "",
    previousUpdateCmd: "",
    original: {
      path: "/data/notes",
      pattern: "**/*.md",
      ignore: [],
    },
    ...overrides,
  };
}

describe("planSettings", () => {
  it("returns empty when nothing changed", () => {
    expect(planSettings(draft())).toEqual([]);
  });

  it("yaml only when path changes", () => {
    const steps = planSettings(draft({ path: "/other" }));
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      type: "yaml",
      patch: { path: "/other" },
    });
    expect(steps[1]).toMatchObject({ type: "job", kind: "update" });
  });

  it("include toggle without yaml", () => {
    const steps = planSettings(
      draft({ include: false, wasIncluded: true }),
    );
    expect(steps).toEqual([
      {
        type: "job",
        label: "qmd collection exclude",
        kind: "collection.exclude",
        opts: { name: "notes" },
      },
    ]);
  });

  it("update-cmd then update when command changes", () => {
    const steps = planSettings(
      draft({ updateCmd: "git pull", previousUpdateCmd: "" }),
    );
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      type: "job",
      kind: "collection.updateCmd",
      opts: { name: "notes", cmd: "git pull" },
    });
    expect(steps[1]).toMatchObject({ kind: "update" });
  });

  it("orders yaml → include → update-cmd → update", () => {
    const steps = planSettings(
      draft({
        path: "/new",
        include: false,
        wasIncluded: true,
        updateCmd: "make",
        previousUpdateCmd: "",
      }),
    );
    expect(steps.map((s) => s.type)).toEqual(["yaml", "job", "job", "job"]);
    expect(steps[0]).toMatchObject({ patch: { path: "/new" } });
    expect(steps[1]).toMatchObject({ kind: "collection.exclude" });
    expect(steps[2]).toMatchObject({ kind: "collection.updateCmd" });
    expect(steps[3]).toMatchObject({ kind: "update" });
  });

  it("patches pattern and ignore in yaml step", () => {
    const steps = planSettings(
      draft({
        pattern: "**/*",
        ignore: ["Archive/**"],
        original: {
          path: "/data/notes",
          pattern: "**/*.md",
          ignore: [],
        },
      }),
    );
    expect(steps[0]).toMatchObject({
      type: "yaml",
      patch: { pattern: "**/*", ignore: ["Archive/**"] },
    });
  });
});
