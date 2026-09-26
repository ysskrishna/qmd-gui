import { access } from "node:fs/promises";
import { Router, type Response } from "express";
import type { JobManager } from "../jobs.js";

export function createJobsRouter(jobs: JobManager): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ jobs: jobs.listRecent() });
  });

  router.post("/", async (req, res) => {
    const body = req.body as { kind?: string; opts?: Record<string, unknown> };
    if (!body.kind || typeof body.kind !== "string") {
      res.status(400).json({ error: "kind is required" });
      return;
    }
    try {
      const opts = body.opts ?? {};
      if (body.kind === "skill.install" && opts.cwd !== undefined) {
        const cwd = String(opts.cwd);
        try {
          await access(cwd);
        } catch {
          res.status(400).json({ error: "Project folder does not exist." });
          return;
        }
      }
      const { jobId, argv } = await jobs.enqueue({
        kind: body.kind as Parameters<JobManager["enqueue"]>[0]["kind"],
        opts,
      });
      res.status(202).json({ jobId, argv });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 400;
      const message = err instanceof Error ? err.message : String(err);
      res.status(status).json({ error: message });
    }
  });

  router.get("/:id/events", (req, res) => {
    const record = jobs.getJob(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    setupSse(res);
    for (const line of record.lines) {
      sendSse(res, "line", line);
    }
    if (record.done) {
      sendSse(res, "done", record.done);
      res.end();
      return;
    }
    const onLine = (line: unknown) => sendSse(res, "line", line);
    const onDone = (done: unknown) => {
      sendSse(res, "done", done);
      res.end();
    };
    record.emitter.on("line", onLine);
    record.emitter.on("done", onDone);
    req.on("close", () => {
      record.emitter.off("line", onLine);
      record.emitter.off("done", onDone);
    });
  });

  return router;
}

function setupSse(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

function sendSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
