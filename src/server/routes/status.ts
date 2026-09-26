import { Router } from "express";
import { parseStatus } from "../qmd/parse/status.js";
import type { QmdService } from "../qmd/service.js";

export function createStatusRouter(service: QmdService): Router {
  const router = Router();
  router.get("/", async (_req, res) => {
    try {
      const { stdout } = await service.run(["status"]);
      res.json(parseStatus(stdout));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });
  return router;
}
