import { describe, expect, it } from "vitest";
import { assertBindAllowed, isLoopbackHost } from "../../src/server/security.js";

describe("security", () => {
  it("detects loopback hosts", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("10.0.0.1")).toBe(false);
  });

  it("refuses non-loopback bind without basic auth env", () => {
    const prevUser = process.env.QMD_GUI_USER;
    const prevPass = process.env.QMD_GUI_PASSWORD;
    delete process.env.QMD_GUI_USER;
    delete process.env.QMD_GUI_PASSWORD;
    expect(() => assertBindAllowed("0.0.0.0")).toThrow();
    process.env.QMD_GUI_USER = prevUser;
    process.env.QMD_GUI_PASSWORD = prevPass;
  });
});
