import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app.js";
import { API_TOKEN_HEADER } from "../../src/shared/constants.js";

const fixturesWeb = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "web",
);
const fakeQmd = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "fake-qmd.mjs",
);

describe("fs and pick-folder API", () => {
  it("lists directories under home on loopback bind", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: "t",
      host: "127.0.0.1",
      port: 8765,
      qmdBin: fakeQmd,
    });
    const res = await request(app)
      .get("/api/fs/dirs")
      .set("Host", "127.0.0.1:8765")
      .set(API_TOKEN_HEADER, "t")
      .expect(200);
    expect(res.body.path).toBeTruthy();
    expect(Array.isArray(res.body.dirs)).toBe(true);
  });

  it("refuses directory browser when not bound to loopback", async () => {
    const prevUser = process.env.QMD_GUI_USER;
    const prevPass = process.env.QMD_GUI_PASSWORD;
    process.env.QMD_GUI_USER = "u";
    process.env.QMD_GUI_PASSWORD = "p";
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: "t",
      host: "0.0.0.0",
      port: 8765,
      qmdBin: fakeQmd,
    });
    const res = await request(app)
      .get("/api/fs/dirs")
      .set("Host", "0.0.0.0:8765")
      .auth("u", "p")
      .set(API_TOKEN_HEADER, "t")
      .expect(403);
    expect(res.body.error).toMatch(/loopback/i);
    process.env.QMD_GUI_USER = prevUser;
    process.env.QMD_GUI_PASSWORD = prevPass;
  });

  it("returns 501 on Linux when folder picker is unavailable", async () => {
    if (process.platform !== "linux") return;
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: "t",
      host: "127.0.0.1",
      port: 8765,
      qmdBin: fakeQmd,
    });
    const res = await request(app)
      .post("/api/pick-folder")
      .set("Host", "127.0.0.1:8765")
      .set(API_TOKEN_HEADER, "t");
    if (res.status === 501) {
      expect(res.body.error).toMatch(/zenity|kdialog/i);
    }
  });
});
