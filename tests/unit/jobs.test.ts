import { describe, expect, it, vi } from "vitest";
import { JobManager } from "../../src/server/jobs.js";
import { QmdRunner } from "../../src/server/qmd/runner.js";

describe("JobManager", () => {
  it("serializes write jobs", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    vi.spyOn(QmdRunner.prototype, "run").mockImplementation(async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 25));
      concurrent--;
      return { exitCode: 0, stdout: "", stderr: "", durationMs: 1 };
    });

    const jobs = new JobManager("qmd");
    void jobs.enqueue({ kind: "update", opts: {} });
    void jobs.enqueue({ kind: "embed", opts: {} });
    await new Promise((r) => setTimeout(r, 120));
    expect(maxConcurrent).toBe(1);
    vi.restoreAllMocks();
  });

  it("does not block read jobs behind writes", async () => {
    let readStarted = false;
    vi.spyOn(QmdRunner.prototype, "run").mockImplementation(async (argv) => {
      if (argv[0] === "doctor") readStarted = true;
      else await new Promise((r) => setTimeout(r, 80));
      return { exitCode: 0, stdout: "", stderr: "", durationMs: 1 };
    });

    const jobs = new JobManager("qmd");
    void jobs.enqueue({ kind: "update", opts: {} });
    void jobs.enqueue({ kind: "doctor", opts: {} });
    await new Promise((r) => setTimeout(r, 20));
    expect(readStarted).toBe(true);
    vi.restoreAllMocks();
  });
});
