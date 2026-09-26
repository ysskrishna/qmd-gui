import { Router } from "express";
import { parseGet } from "../qmd/parse/get.js";
import type { QmdService } from "../qmd/service.js";

export function createDocsRouter(service: QmdService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const target = typeof req.query.target === "string" ? req.query.target : "";
    if (!target) {
      res.status(400).json({ error: "target query param is required" });
      return;
    }

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const lines = typeof req.query.lines === "string" ? req.query.lines : undefined;
    const full = req.query.full === "1" || req.query.full === "true";

    const argv = ["get", target];
    if (from) argv.push("--from", from);
    if (lines) argv.push("-l", lines);
    if (full) argv.push("--full-path");

    try {
      const { stdout } = await service.run(argv);
      res.json(parseGet(stdout));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
