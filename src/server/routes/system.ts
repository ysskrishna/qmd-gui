import { Router } from "express";
import { detectQmd } from "../qmd/detect.js";
import { parseStatus } from "../qmd/parse/status.js";
import { QmdService } from "../qmd/service.js";
import { resolveIndexYmlPath } from "../paths.js";

export function createSystemRouter(
  qmdBinFlag?: string,
  service?: QmdService | null,
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const detected = await detectQmd(qmdBinFlag);
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
    });
  });

  return router;
}
