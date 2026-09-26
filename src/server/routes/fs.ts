import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import { isLoopbackHost } from "../security.js";

export function createFsRouter(bindHost: string): Router {
  const router = Router();

  router.get("/dirs", async (req, res) => {
    if (!isLoopbackHost(bindHost)) {
      res.status(403).json({
        error: "Directory browser is only available when bound to loopback.",
      });
      return;
    }

    const raw = typeof req.query.path === "string" ? req.query.path : os.homedir();
    const resolved = path.resolve(raw);
    const home = os.homedir();
    if (!resolved.startsWith(home) && !resolved.startsWith("/tmp")) {
      res.status(400).json({ error: "Path must be under your home directory." });
      return;
    }

    try {
      const entries = await readdir(resolved, { withFileTypes: true });
      const dirs = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => ({
          name: e.name,
          path: path.join(resolved, e.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ path: resolved, parent: path.dirname(resolved), dirs });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  });

  return router;
}
