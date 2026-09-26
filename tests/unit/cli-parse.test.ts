import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/server/cli.js";

describe("parseCliArgs", () => {
  it("parses start with flags", () => {
    const o = parseCliArgs([
      "start",
      "--host",
      "127.0.0.1",
      "--port",
      "9999",
      "--detach",
      "--qmd",
      "/bin/qmd",
    ]);
    expect(o.command).toBe("start");
    expect(o.port).toBe(9999);
    expect(o.detach).toBe(true);
    expect(o.qmdBin).toBe("/bin/qmd");
  });
});
