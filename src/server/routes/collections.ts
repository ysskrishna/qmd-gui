import { access } from "node:fs/promises";
import { Router } from "express";
import { isMap, isSeq } from "yaml";
import { readIndexYml, writeCollectionFields } from "../config.js";
import { parseCollectionList } from "../qmd/parse/collection-list.js";
import { parseCollectionShow } from "../qmd/parse/collection-show.js";
import { parseLs } from "../qmd/parse/ls.js";
import type { QmdService } from "../qmd/service.js";
import { resolveIndexYmlPath } from "../paths.js";
import { parseCollectionName } from "../../shared/validate.js";

export function createCollectionsRouter(service: QmdService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const { stdout } = await service.run(["collection", "list"]);
      const listed = parseCollectionList(stdout);
      const indexPath = resolveIndexYmlPath();
      const yamlCols: Record<string, Record<string, unknown>> = {};
      try {
        await access(indexPath);
        const { doc } = await readIndexYml(indexPath);
        const root = doc.contents;
        if (isMap(root)) {
          const collections = root.get("collections");
          if (isMap(collections)) {
            for (const { key: name, value: node } of collections.items) {
              if (isMap(node)) {
                yamlCols[String(name)] = {
                  path: node.get("path"),
                  pattern: node.get("pattern"),
                  ignore: node.get("ignore"),
                  includeByDefault: node.get("includeByDefault"),
                };
              }
            }
          }
        }
      } catch {
        /* no yaml yet */
      }

      const merged = listed.map((row) => ({
        ...row,
        config: yamlCols[row.name] ?? null,
      }));
      res.json({ collections: merged });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  router.get("/:name/config", async (req, res) => {
    try {
      const name = parseCollectionName(req.params.name);
      const indexPath = resolveIndexYmlPath();
      const { baseHash, doc } = await readIndexYml(indexPath);
      const root = doc.contents;
      if (!isMap(root)) throw new Error("invalid index.yml");
      const collections = root.get("collections");
      if (!isMap(collections)) {
        res.status(404).json({ error: "Collection not found in index.yml" });
        return;
      }
      const node = collections.get(name);
      if (!isMap(node)) {
        res.status(404).json({ error: "Collection not found in index.yml" });
        return;
      }
      const ignoreNode = node.get("ignore");
      const ignoreList: string[] = [];
      if (isSeq(ignoreNode)) {
        for (const item of ignoreNode.items) {
          ignoreList.push(String(item));
        }
      }
      res.json({
        baseHash,
        path: String(node.get("path") ?? ""),
        pattern: String(node.get("pattern") ?? "**/*.md"),
        ignore: ignoreList,
        includeByDefault: node.get("includeByDefault") !== false,
        update: node.get("update") ? String(node.get("update")) : "",
      });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : String(err);
      res.status(status).json({ error: message });
    }
  });

  router.put("/:name/config", async (req, res) => {
    try {
      const name = parseCollectionName(req.params.name);
      const body = req.body as {
        baseHash?: string;
        path?: string;
        pattern?: string;
        ignore?: string[];
      };
      if (!body.baseHash) {
        res.status(400).json({ error: "baseHash is required" });
        return;
      }
      const indexPath = resolveIndexYmlPath();
      const patch: { path?: string; pattern?: string; ignore?: string[] } = {};
      if (body.path !== undefined) patch.path = body.path;
      if (body.pattern !== undefined) patch.pattern = body.pattern;
      if (body.ignore !== undefined) patch.ignore = body.ignore;
      const result = await writeCollectionFields(
        indexPath,
        name,
        patch,
        body.baseHash,
      );
      res.json({ baseHash: result.baseHash });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : String(err);
      res.status(status).json({ error: message });
    }
  });

  router.get("/:name/files", async (req, res) => {
    try {
      const name = parseCollectionName(req.params.name);
      const prefix = typeof req.query.path === "string" ? req.query.path : "";
      const target = prefix ? `${name}/${prefix.replace(/^\//, "")}` : name;
      const { stdout } = await service.run(["ls", target]);
      res.json({ files: parseLs(stdout) });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  router.get("/:name", async (req, res) => {
    try {
      const name = parseCollectionName(req.params.name);
      const { stdout } = await service.run(["collection", "show", name]);
      res.json(parseCollectionShow(stdout));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
