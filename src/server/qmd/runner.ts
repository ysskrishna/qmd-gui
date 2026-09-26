import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { qmdChildEnv } from "./detect.js";
import { spawnQmd } from "./spawn-qmd.js";

export type RunOptions = {
  timeoutMs?: number;
  cwd?: string;
  onLine?: (line: string, stream: "stdout" | "stderr") => void;
};

export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

const ANSI_RE =
  // eslint-disable-next-line no-control-regex
  /\u001b\[[0-9;]*[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}

export class QmdRunner {
  private active: ChildProcessWithoutNullStreams | null = null;

  constructor(private readonly qmdBin: string) {}

  async run(argv: string[], options: RunOptions = {}): Promise<RunResult> {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const child = spawnQmd(this.qmdBin, argv, {
        env: qmdChildEnv(),
        cwd: options.cwd,
      });
      this.active = child;

      let stdout = "";
      let stderr = "";
      let killed = false;

      const timer =
        options.timeoutMs !== undefined
          ? setTimeout(() => {
              killed = true;
              this.cancel();
            }, options.timeoutMs)
          : undefined;

      const flushLines = (
        chunk: string,
        stream: "stdout" | "stderr",
        acc: { buf: string },
      ) => {
        acc.buf += chunk;
        let idx: number;
        while ((idx = acc.buf.indexOf("\n")) !== -1) {
          const line = stripAnsi(acc.buf.slice(0, idx));
          options.onLine?.(line, stream);
          acc.buf = acc.buf.slice(idx + 1);
        }
      };

      const outAcc = { buf: "" };
      const errAcc = { buf: "" };

      child.stdout.on("data", (c) => {
        const s = String(c);
        stdout += s;
        flushLines(s, "stdout", outAcc);
      });
      child.stderr.on("data", (c) => {
        const s = String(c);
        stderr += s;
        flushLines(s, "stderr", errAcc);
      });

      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        this.active = null;
        reject(err);
      });

      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        this.active = null;
        if (outAcc.buf) options.onLine?.(stripAnsi(outAcc.buf), "stdout");
        if (errAcc.buf) options.onLine?.(stripAnsi(errAcc.buf), "stderr");
        const exitCode = killed ? 124 : (code ?? 1);
        resolve({
          exitCode,
          stdout: stripAnsi(stdout),
          stderr: stripAnsi(stderr),
          durationMs: Date.now() - started,
        });
      });
    });
  }

  cancel(): void {
    const child = this.active;
    if (!child || child.killed) return;
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!child.killed) child.kill("SIGKILL");
    }, 5_000);
  }
}
