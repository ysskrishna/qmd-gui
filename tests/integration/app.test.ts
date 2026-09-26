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

describe("createApp", () => {
  it("serves health and SPA shell", async () => {
    const app = createApp({ webDistDir: fixturesWeb });
    await request(app).get("/health").expect(200, { ok: true });
    const html = await request(app).get("/").expect(200);
    expect(html.text).toContain("Hello fixture");
  });
});
