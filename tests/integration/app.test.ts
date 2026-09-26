import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app.js";

const fixturesWeb = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "web",
);

const host = "127.0.0.1";
const port = 8765;

describe("createApp", () => {
  it("serves health and SPA shell with valid Host", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
    });
    await request(app)
      .get("/health")
      .set("Host", `${host}:${port}`)
      .expect(200, { ok: true });
    const html = await request(app)
      .get("/")
      .set("Host", `${host}:${port}`)
      .expect(200);
    expect(html.text).toContain("Hello fixture");
  });

  it("serves API system without auth header", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
    });
    await request(app)
      .get("/api/system")
      .set("Host", `${host}:${port}`)
      .expect(200);
  });

  it("rejects wrong Host header", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
    });
    await request(app)
      .get("/health")
      .set("Host", "evil.example.com")
      .expect(403);
  });
});
