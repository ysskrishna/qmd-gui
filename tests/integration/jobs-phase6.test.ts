import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app.js";

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
const tmpRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".tmp-jobs-phase6",
);

const host = "127.0.0.1";
const port = 8765;

function headers() {
  return {
    Host: `${host}:${port}`,
  };
}

async function waitForJob(
  app: Awaited<ReturnType<typeof createApp>>,
  jobId: string,
) {
  for (let i = 0; i < 40; i++) {
    const res = await request(app).get("/api/jobs").set(headers());
    const job = res.body.jobs?.find((j: { id: string }) => j.id === jobId);
    if (job?.exitCode !== undefined) return job;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("job timeout");
}

afterEach(async () => {
  delete process.env.FAKE_QMD_STATE;
  delete process.env.FAKE_QMD_CWD_LOG;
  await rm(tmpRoot, { recursive: true, force: true });
});

describe("Phase 6 jobs", () => {
  it("rejects cleanup without preview in session", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
      qmdBin: fakeQmd,
    });
    await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "cleanup", opts: {} })
      .expect(409);
  });

  it("allows cleanup after successful dry-run", async () => {
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
      qmdBin: fakeQmd,
    });
    const dry = await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "cleanupDry", opts: {} })
      .expect(202);
    await waitForJob(app, dry.body.jobId);
    const clean = await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "cleanup", opts: {} })
      .expect(202);
    const job = await waitForJob(app, clean.body.jobId);
    expect(job.exitCode).toBe(0);
  });

  it("reflects MCP PID in status after mcp.start", async () => {
    await mkdir(tmpRoot, { recursive: true });
    process.env.FAKE_QMD_STATE = path.join(tmpRoot, "state.json");
    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
      qmdBin: fakeQmd,
    });
    const start = await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "mcp.start", opts: { port: 8181 } })
      .expect(202);
    await waitForJob(app, start.body.jobId);
    const status = await request(app).get("/api/status").set(headers()).expect(200);
    expect(status.body.mcpPid).toBe(424242);
  });

  it("skill install uses project cwd and rejects missing folder", async () => {
    await mkdir(tmpRoot, { recursive: true });
    const projectDir = path.join(tmpRoot, "my-project");
    await mkdir(projectDir);
    const cwdLog = path.join(tmpRoot, "cwd.log");
    process.env.FAKE_QMD_CWD_LOG = cwdLog;

    const app = await createApp({
      webDistDir: fixturesWeb,
      host,
      port,
      qmdBin: fakeQmd,
    });

    await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "skill.install", opts: { cwd: "/no/such/dir", yes: true } })
      .expect(400);

    const res = await request(app)
      .post("/api/jobs")
      .set(headers())
      .send({ kind: "skill.install", opts: { cwd: projectDir, yes: true } })
      .expect(202);
    await waitForJob(app, res.body.jobId);
    const logged = await readFile(cwdLog, "utf8");
    expect(logged.trim()).toBe(projectDir);
  });
});
