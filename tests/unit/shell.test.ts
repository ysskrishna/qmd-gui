import { describe, expect, it } from "vitest";
import { toDollarQuote, toShell } from "../../src/shared/shell.js";

describe("toShell", () => {
  it("quotes arguments with spaces", () => {
    expect(toShell(["search", "--", "hello world"])).toBe(
      "qmd search -- 'hello world'",
    );
  });

  it("uses bare flags when safe", () => {
    expect(toShell(["status"])).toBe("qmd status");
  });
});

describe("toDollarQuote", () => {
  it("escapes newlines for typed queries", () => {
    expect(toDollarQuote(["lex:foo", "vec:bar"])).toBe("$'lex:foo\\nvec:bar'");
  });
});
