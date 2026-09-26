import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import {
  JOB_HISTORY_MAX,
  JOB_LINE_BUFFER_MAX,
  READ_JOB_TIMEOUT_MS,
  SEARCH_JOB_TIMEOUT_MS,
} from "../shared/constants.js";
import { buildJobArgv, isWriteJob } from "../shared/commands.js";
import type { JobKind, JobSummary } from "../shared/types.js";
import { QmdRunner } from "./qmd/runner.js";

export type JobLineEvent = {
  line: string;
  stream: "stdout" | "stderr";
};

export type JobDoneEvent = {
  exitCode: number;
  result?: unknown;
};

export type JobRecord = JobSummary & {
  opts: Record<string, unknown>;
  lines: JobLineEvent[];
  emitter: EventEmitter;
  done?: JobDoneEvent;
};

type EnqueueInput = {
  kind: JobKind;
  opts: Record<string, unknown>;
};

export class JobManager {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly history: string[] = [];
  private writeChain: Promise<void> = Promise.resolve();
  private runningWrite: string | null = null;
  private cleanupPreviewReady = false;

  constructor(private readonly qmdBin: string) {}

  listRecent(): JobSummary[] {
    return this.history
      .map((id) => this.jobs.get(id))
      .filter((j): j is JobRecord => Boolean(j))
      .map((j) => ({
        id: j.id,
        kind: j.kind,
        argv: j.argv,
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
        exitCode: j.exitCode,
      }));
  }

  getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  async enqueue(input: EnqueueInput): Promise<{ jobId: string; argv: string[] }> {
    if (input.kind === "cleanup" && !this.cleanupPreviewReady) {
      throw Object.assign(
        new Error("Run cleanup preview (dry-run) in this session before cleaning up."),
        { status: 409 },
      );
    }
    const argv = buildJobArgv(input.kind, input.opts);
    const id = randomUUID();
    const startedAt = new Date().toISOString();
    const emitter = new EventEmitter();
    const record: JobRecord = {
      id,
      kind: input.kind,
      argv,
      opts: input.opts,
      startedAt,
      lines: [],
      emitter,
    };
    this.jobs.set(id, record);
    this.history.unshift(id);
    if (this.history.length > JOB_HISTORY_MAX) {
      const drop = this.history.pop();
      if (drop) this.jobs.delete(drop);
    }

    const run = () => this.executeJob(record);
    if (isWriteJob(input.kind)) {
      this.writeChain = this.writeChain.then(async () => {
        this.runningWrite = id;
        try {
          await run();
        } finally {
          this.runningWrite = null;
        }
      });
    } else {
      void run();
    }

    return { jobId: id, argv };
  }

  private pushLine(record: JobRecord, event: JobLineEvent) {
    record.lines.push(event);
    if (record.lines.length > JOB_LINE_BUFFER_MAX) {
      record.lines.splice(0, record.lines.length - JOB_LINE_BUFFER_MAX);
    }
    record.emitter.emit("line", event);
  }

  private async executeJob(record: JobRecord): Promise<void> {
    const runner = new QmdRunner(this.qmdBin);
    const timeoutMs = this.timeoutFor(record.kind);
    let result: unknown;
    try {
      const cwd =
        record.kind === "skill.install" && record.opts.cwd
          ? String(record.opts.cwd)
          : undefined;
      const res = await runner.run(record.argv, {
        timeoutMs,
        cwd,
        onLine: (line, stream) => this.pushLine(record, { line, stream }),
      });
      record.exitCode = res.exitCode;
      if (record.kind === "cleanupDry" && res.exitCode === 0) {
        this.cleanupPreviewReady = true;
      }
      if (
        (record.kind === "search" ||
          record.kind === "vsearch" ||
          record.kind === "query") &&
        res.exitCode === 0
      ) {
        try {
          result = JSON.parse(res.stdout);
        } catch {
          result = undefined;
        }
      }
      const done: JobDoneEvent = { exitCode: res.exitCode, result };
      record.done = done;
      record.finishedAt = new Date().toISOString();
      record.emitter.emit("done", done);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.pushLine(record, { line: message, stream: "stderr" });
      const done: JobDoneEvent = { exitCode: 1 };
      record.done = done;
      record.exitCode = 1;
      record.finishedAt = new Date().toISOString();
      record.emitter.emit("done", done);
    }
  }

  private timeoutFor(kind: JobKind): number | undefined {
    if (kind === "search" || kind === "vsearch" || kind === "query") {
      return SEARCH_JOB_TIMEOUT_MS;
    }
    if (
      kind === "cleanupDry" ||
      kind === "doctor" ||
      kind === "collection.remove"
    ) {
      return READ_JOB_TIMEOUT_MS;
    }
    if (!isWriteJob(kind)) return READ_JOB_TIMEOUT_MS;
    return undefined;
  }

  get runningWriteJobId(): string | null {
    return this.runningWrite;
  }
}
