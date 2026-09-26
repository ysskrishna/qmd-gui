import { Router } from "express";
import type { QmdDetectResult } from "../qmd/detect.js";
import { parseStatus } from "../qmd/parse/status.js";
import type { QmdService } from "../qmd/service.js";
import { resolveIndexYmlPath } from "../paths.js";

export function createSystemRouter(
  detected: QmdDetectResult,
  service?: QmdService | null,
  guiPort?: number,
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const configPath = resolveIndexYmlPath();
    let dbPath: string | null = null;
    if (detected.qmdBin && service) {
      try {
        const { stdout } = await service.run(["status"]);
        dbPath = parseStatus(stdout).dbPath;
      } catch {
        dbPath = null;
      }
    }
    res.json({
      qmdFound: detected.qmdBin !== null,
      version: detected.version,
      supported: detected.supported,
      configPath,
      dbPath,
      guiPort: guiPort ?? null,
      platform: process.platform,
    });
  });

  return router;
}
