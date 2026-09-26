import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_GUI_HOST,
  DEFAULT_GUI_PORT,
} from "../shared/constants.js";
import { createApp } from "./app.js";
import { isProcessAlive, readPidFile, removePidFile, writePidFile } from "./pid.js";
import { assertBindAllowed } from "./security.js";

export type CliOptions = {
  command: string;
  host: string;
  port: number;
  openBrowser: boolean;
  detach: boolean;
  qmdBin?: string;
};

export function parseCliArgs(argv: string[]): CliOptions {
  const args = [...argv];
  let command = "start";
  if (args[0] && !args[0].startsWith("-")) {
    command = args.shift() ?? "start";
  }

  let host = process.env.HOST ?? DEFAULT_GUI_HOST;
  let port = Number(process.env.PORT ?? DEFAULT_GUI_PORT);
  let openBrowser = true;
  let detach = false;
  let qmdBin: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--no-open") openBrowser = false;
    else if (a === "--detach") detach = true;
    else if (a === "--host" && args[i + 1]) host = args[++i];
    else if (a === "--port" && args[i + 1]) port = Number(args[++i]);
    else if (a === "--qmd" && args[i + 1]) qmdBin = args[++i];
  }

  return { command, host, port, openBrowser, detach, qmdBin };
}

export async function startServer(options: CliOptions): Promise<void> {
  assertBindAllowed(options.host);
  const token = randomBytes(32).toString("hex");
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const webDistDir = path.join(rootDir, "..", "web");
  const app = await createApp({
    webDistDir,
    apiToken: token,
    host: options.host,
    port: options.port,
    qmdBin: options.qmdBin,
  });
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, () => resolve());
  });

  await writePidFile({
    pid: process.pid,
    host: options.host,
    port: options.port,
  });

  const url = `http://${options.host}:${options.port}/`;
  console.log(`qmd-gui listening on ${url}`);

  if (options.openBrowser && options.host === "127.0.0.1") {
    const { exec } = await import("node:child_process");
    const platform = process.platform;
    const cmd =
      platform === "darwin"
        ? `open "${url}"`
        : platform === "win32"
          ? `start "" "${url}"`
          : `xdg-open "${url}"`;
    exec(cmd, () => undefined);
  }

  const shutdown = async () => {
    await removePidFile();
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

export async function cmdStop(): Promise<number> {
  const pidInfo = await readPidFile();
  if (!pidInfo) {
    console.error("qmd-gui is not running (no PID file)");
    return 1;
  }
  if (!isProcessAlive(pidInfo.pid)) {
    await removePidFile();
    console.error("stale PID file removed");
    return 1;
  }
  process.kill(pidInfo.pid, "SIGTERM");
  await removePidFile();
  console.log(`stopped qmd-gui (pid ${pidInfo.pid})`);
  return 0;
}

export async function cmdStatus(): Promise<number> {
  const pidInfo = await readPidFile();
  if (!pidInfo) {
    console.log("qmd-gui: stopped");
    return 0;
  }
  if (!isProcessAlive(pidInfo.pid)) {
    console.log(`qmd-gui: stale pid ${pidInfo.pid}`);
    return 1;
  }
  console.log(
    `qmd-gui: running pid=${pidInfo.pid} http://${pidInfo.host}:${pidInfo.port}/`,
  );
  return 0;
}

export function cmdStartDetached(options: CliOptions): number {
  const self = process.argv[1];
  const args = [
    self,
    "start",
    "--host",
    options.host,
    "--port",
    String(options.port),
    "--no-open",
  ];
  if (options.qmdBin) args.push("--qmd", options.qmdBin);
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();
  console.log(`qmd-gui started in background (pid ${child.pid})`);
  return 0;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  switch (options.command) {
    case "start":
      if (options.detach) {
        process.exit(cmdStartDetached(options));
      }
      await startServer(options);
      break;
    case "stop":
      process.exit(await cmdStop());
      break;
    case "status":
      process.exit(await cmdStatus());
      break;
    default:
      console.error(`Unknown command: ${options.command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
