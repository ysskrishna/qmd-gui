import { describe, expect, it } from "vitest";
import {
  parseVersionLine,
  semverInRange,
} from "../../src/server/qmd/detect.js";

describe("parseVersionLine", () => {
  it("extracts semver from qmd output", () => {
    expect(parseVersionLine("qmd 2.8.3 (facd35e)\n")).toBe("2.8.3");
  });
});

describe("semverInRange", () => {
  it("supports >=2.8.0 <3", () => {
    expect(semverInRange("2.8.0", "2.8.0", "3.0.0")).toBe(true);
    expect(semverInRange("2.9.9", "2.8.0", "3.0.0")).toBe(true);
    expect(semverInRange("3.0.0", "2.8.0", "3.0.0")).toBe(false);
    expect(semverInRange("2.7.9", "2.8.0", "3.0.0")).toBe(false);
  });
});
