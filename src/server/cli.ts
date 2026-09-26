import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;

function parseArgs(argv: string[]): {
  command: string;
  host: string;
  port: number;
  openBrowser: boolean;
} {
  const args = [...argv];
  let command = "start";
  if (args[0] && !args[0].startsWith("-")) {
    command = args.shift() ?? "start";
  }

  let host = DEFAULT_HOST;
  let port = DEFAULT_PORT;
  let openBrowser = true;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--no-open") openBrowser = false;
    else if (a === "--host" && args[i + 1]) host = args[++i];
    else if (a === "--port" && args[i + 1]) port = Number(args[++i]);
  }

  return { command, host, port, openBrowser };
}

async function cmdStart(host: string, port: number, openBrowser: boolean) {
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const webDistDir = path.join(rootDir, "..", "web");
  const app = createApp({ webDistDir });
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const url = `http://${host}:${port}/`;
  console.log(`qmd-gui listening on ${url}`);

  if (openBrowser && host === "127.0.0.1") {
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

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main() {
  const { command, host, port, openBrowser } = parseArgs(
    process.argv.slice(2),
  );

  switch (command) {
    case "start":
      await cmdStart(host, port, openBrowser);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
