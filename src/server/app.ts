import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export type CreateAppOptions = {
  webDistDir?: string;
  apiToken?: string;
};

export function createApp(options: CreateAppOptions = {}): Express {
  const webDistDir =
    options.webDistDir ?? path.join(rootDir, "..", "web");
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(express.static(webDistDir, { index: false }));

  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(webDistDir, "index.html"));
  });

  return app;
}
