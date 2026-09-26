import { Router } from "express";
import { parseContextList } from "../qmd/parse/context-list.js";
import type { QmdService } from "../qmd/service.js";

export function createContextRouter(service: QmdService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const { stdout } = await service.run(["context", "list"]);
      const rows = parseContextList(stdout);
      const byCollection = new Map<string, typeof rows>();
      for (const row of rows) {
        const key = row.collection;
        if (!byCollection.has(key)) byCollection.set(key, []);
        byCollection.get(key)!.push(row);
      }
      res.json({
        rows,
        byCollection: Object.fromEntries(byCollection),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
