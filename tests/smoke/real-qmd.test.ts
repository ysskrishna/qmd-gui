import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app.js";
import { detectQmd } from "../../src/server/qmd/detect.js";
import { API_TOKEN_HEADER } from "../../src/shared/constants.js";

const execFileAsync = promisify(execFile);
const fixturesWeb = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "web",
);

const host = "127.0.0.1";
const port = 8770;
const token = "real-smoke-token";

async function waitForJob(
  app: Awaited<ReturnType<typeof createApp>>,
  jobId: string,
) {
  for (let i = 0; i < 120; i++) {
    const res = await request(app)
      .get("/api/jobs")
      .set("Host", `${host}:${port}`)
      .set(API_TOKEN_HEADER, token);
    const job = res.body.jobs?.find((j: { id: string }) => j.id === jobId);
    if (job?.exitCode !== undefined) return job;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("job timeout");
}

describe("real qmd @real", () => {
  let tmp: string;
  let configDir: string;
  let app: Awaited<ReturnType<typeof createApp>>;
  let qmdBin: string | null;

  beforeAll(async () => {
    const detected = await detectQmd();
    qmdBin = detected.qmdBin;
    if (!qmdBin || !detected.supported) return;

    tmp = await mkdtemp(path.join(os.tmpdir(), "qmd-gui-real-"));
    configDir = path.join(tmp, "config");
    const notes = path.join(tmp, "notes");
    await mkdir(configDir, { recursive: true });
    await mkdir(notes, { recursive: true });
    await writeFile(
      path.join(notes, "a.md"),
      "# Alpha\n\nkeyword smoke alpha\n",
      "utf8",
    );
    await writeFile(
      path.join(notes, "b.md"),
      "# Beta\n\nkeyword smoke beta\n",
      "utf8",
    );
    await writeFile(
      path.join(notes, "c.md"),
      "# Gamma\n\nkeyword smoke gamma\n",
      "utf8",
    );

    const env = { ...process.env, QMD_CONFIG_DIR: configDir };
    await execFileAsync(qmdBin, ["collection", "add", notes, "--name", "smoke"], {
      env,
    });
    await execFileAsync(qmdBin, ["update"], { env });

    process.env.QMD_CONFIG_DIR = configDir;
    app = await createApp({
      webDistDir: fixturesWeb,
      apiToken: token,
      host,
      port,
      qmdBin,
    });
  }, 180_000);

  afterAll(async () => {
    delete process.env.QMD_CONFIG_DIR;
    if (tmp) {
      const { rm } = await import("node:fs/promises");
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("runs keyword search, status, ls, and context via API", async () => {
    if (!qmdBin || !app) {
      expect(qmdBin, "qmd 2.8.x must be on PATH for @real smoke").toBeTruthy();
      return;
    }

    const headers = {
      Host: `${host}:${port}`,
      [API_TOKEN_HEADER]: token,
    };

    const status = await request(app).get("/api/status").set(headers).expect(200);
    expect(status.body.totalFiles).toBeGreaterThanOrEqual(3);

    const ls = await request(app)
      .get("/api/collections/smoke/files")
      .set(headers)
      .expect(200);
    expect(ls.body.files.length).toBeGreaterThanOrEqual(3);

    const search = await request(app)
      .post("/api/jobs")
      .set(headers)
      .send({ kind: "search", opts: { mode: "search", query: "alpha" } })
      .expect(202);
    const searchJob = await waitForJob(app, search.body.jobId);
    expect(searchJob.exitCode).toBe(0);

    const ctxAdd = await request(app)
      .post("/api/jobs")
      .set(headers)
      .send({
        kind: "context.add",
        opts: { path: "qmd://smoke/", text: "Smoke test collection" },
      })
      .expect(202);
    const ctxAddJob = await waitForJob(app, ctxAdd.body.jobId);
    expect(ctxAddJob.exitCode).toBe(0);

    const ctx = await request(app).get("/api/context").set(headers).expect(200);
    expect(
      ctx.body.rows.some(
        (r: { collection: string; text: string }) =>
          r.collection === "smoke" &&
          r.text.includes("Smoke test collection"),
      ),
    ).toBe(true);

    const ctxRm = await request(app)
      .post("/api/jobs")
      .set(headers)
      .send({ kind: "context.rm", opts: { path: "qmd://smoke/" } })
      .expect(202);
    await waitForJob(app, ctxRm.body.jobId);
  }, 180_000);
});
