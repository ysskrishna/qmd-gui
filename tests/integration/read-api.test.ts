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

const host = "127.0.0.1";
const port = 8765;
const token = "test-token";

describe("read API with fake-qmd", () => {
  it("returns parsed status and collections", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: token,
      host,
      port,
      qmdBin: fakeQmd,
    });

    const status = await request(app)
      .get("/api/status")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(200);
    expect(status.body.pendingEmbeddings).toBe(1);

    const cols = await request(app)
      .get("/api/collections")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(200);
    expect(cols.body.collections[0]?.name).toBe("demo");

    const ctx = await request(app)
      .get("/api/context")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(200);
    expect(ctx.body.rows[0]?.text).toContain("Fixture");

    const doc = await request(app)
      .get("/api/docs")
      .query({ target: "demo/readme.md" })
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(200);
    expect(doc.body.docid).toBe("#129047");
  });

  it("returns 503 when qmd is missing", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: token,
      host,
      port,
      qmdBin: "/nonexistent/qmd-binary",
    });
    await request(app)
      .get("/api/status")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(503);
    const system = await request(app)
      .get("/api/system")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token)
      .expect(200);
    expect(system.body.qmdFound).toBe(false);
  });
});
