import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../src/server/qmd/runner.js";

describe("stripAnsi", () => {
  it("removes color codes", () => {
    expect(stripAnsi("\u001b[31merror\u001b[0m")).toBe("error");
  });
});
