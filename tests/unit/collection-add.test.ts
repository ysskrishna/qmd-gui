import { describe, expect, it } from "vitest";
import {
  defaultCollectionName,
  validateCollectionAddPath,
} from "../../src/shared/collection-add.js";

describe("collection add helpers", () => {
  it("defaults name from basename", () => {
    expect(defaultCollectionName("/Users/me/my notes")).toBe("my_notes");
  });

  it("rejects a .md file path", () => {
    expect(validateCollectionAddPath("/tmp/readme.md")).toEqual({
      ok: false,
      error:
        "Pick the folder, not a single .md file — put the file name in the pattern instead.",
    });
  });

  it("accepts a directory path", () => {
    expect(validateCollectionAddPath("/tmp/notes")).toEqual({
      ok: true,
      path: "/tmp/notes",
    });
  });
});
