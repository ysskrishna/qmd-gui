import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app.js";
import { buildSearchArgv } from "../../src/shared/commands.js";
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
describe("search job integration", () => {
  it("returns argv matching shared preview builder", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: "t",
      host: "127.0.0.1",
      port: 8765,
      qmdBin: fakeQmd,
    });

    const expected = buildSearchArgv("search", {
      mode: "search",
      query: "fixture",
      n: 2,
    });

    const post = await request(app)
      .post("/api/jobs")
      .set("Host", "127.0.0.1:8765")
      .set(API_TOKEN_HEADER, "t")
      .send({
        kind: "search",
        opts: { mode: "search", query: "fixture", n: 2 },
      })
      .expect(202);

    expect(post.body.argv).toEqual(expected);
  });
});
