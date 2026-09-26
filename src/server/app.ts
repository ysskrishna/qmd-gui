import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import { API_TOKEN_HEADER } from "../shared/constants.js";
import { JobManager } from "./jobs.js";
import { detectQmd } from "./qmd/detect.js";
import { createJobsRouter } from "./routes/jobs.js";
import { createSystemRouter } from "./routes/system.js";
import {
  createApiTokenGuard,
  createBasicAuthIfConfigured,
  createHelmetMiddleware,
  createHostGuard,
  createRateLimitMiddleware,
} from "./security.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export type CreateAppOptions = {
  webDistDir?: string;
  apiToken: string;
  host: string;
  port: number;
  qmdBin?: string;
  jobManager?: JobManager;
};

export async function createApp(options: CreateAppOptions): Promise<Express> {
  const webDistDir =
    options.webDistDir ?? path.join(rootDir, "..", "web");
  const detected = await detectQmd(options.qmdBin);
  const qmdBin = detected.qmdBin ?? "qmd";
  const jobs = options.jobManager ?? new JobManager(qmdBin);

  const app = express();
  app.disable("x-powered-by");

  app.use(createHelmetMiddleware());
  app.use(createRateLimitMiddleware());
  const basic = createBasicAuthIfConfigured();
  if (basic) app.use(basic);
  app.use(createHostGuard(options.host, options.port));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const api = express.Router();
  api.use(createApiTokenGuard(options.apiToken));
  api.use(express.json({ limit: "1mb" }));
  api.use("/system", createSystemRouter(options.qmdBin));
  api.use("/jobs", createJobsRouter(jobs));
  app.use("/api", api);

  const indexHtml = await loadIndexHtml(webDistDir, options.apiToken);
  app.use(express.static(webDistDir, { index: false }));

  app.get("/{*path}", (_req, res) => {
    res.type("html").send(indexHtml);
  });

  return app;
}

async function loadIndexHtml(webDistDir: string, token: string): Promise<string> {
  const file = path.join(webDistDir, "index.html");
  let html = await readFile(file, "utf8");
  if (html.includes('name="qmd-gui-token"')) {
    html = html.replace(
      /(<meta\s+name="qmd-gui-token"\s+content=")([^"]*)(")/,
      `$1${token}$3`,
    );
  }
  return html;
}

export { API_TOKEN_HEADER };
