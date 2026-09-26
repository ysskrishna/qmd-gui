import { Router } from "express";
import { detectQmd } from "../qmd/detect.js";
import { resolveIndexYmlPath } from "../paths.js";

export function createSystemRouter(qmdBinFlag?: string): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const detected = await detectQmd(qmdBinFlag);
    const configPath = resolveIndexYmlPath();
    res.json({
      qmdFound: detected.qmdBin !== null,
      version: detected.version,
      supported: detected.supported,
      configPath,
      dbPath: null,
    });
  });

  return router;
}
