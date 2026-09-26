import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument, YAMLMap, YAMLSeq, isMap } from "yaml";

export type CollectionConfigPatch = {
  path?: string;
  pattern?: string;
  ignore?: string[];
};

export type ConfigPaths = {
  configDir: string;
  indexPath: string;
};

export function hashFileContents(contents: string): string {
  return createHash("sha256").update(contents, "utf8").digest("hex");
}

export async function readIndexYml(indexPath: string): Promise<{
  raw: string;
  baseHash: string;
  doc: ReturnType<typeof parseDocument>;
}> {
  const raw = await readFile(indexPath, "utf8");
  const doc = parseDocument(raw);
  return { raw, baseHash: hashFileContents(raw), doc };
}

export async function writeCollectionFields(
  indexPath: string,
  collectionName: string,
  patch: CollectionConfigPatch,
  expectedBaseHash: string,
): Promise<{ baseHash: string }> {
  const { baseHash, doc } = await readIndexYml(indexPath);
  if (baseHash !== expectedBaseHash) {
    const err = new Error("index.yml changed on disk");
    (err as Error & { status: number }).status = 409;
    throw err;
  }

  const root = doc.contents;
  if (!isMap(root)) throw new Error("index.yml root must be a map");

  let collections = root.get("collections");
  if (!collections) {
    collections = new YAMLMap();
    root.set("collections", collections);
  }
  if (!isMap(collections)) throw new Error("collections must be a map");

  let coll = collections.get(collectionName);
  if (!coll) {
    coll = new YAMLMap();
    collections.set(collectionName, coll);
  }
  if (!isMap(coll)) throw new Error("collection entry must be a map");

  if (patch.path !== undefined) coll.set("path", patch.path);
  if (patch.pattern !== undefined) coll.set("pattern", patch.pattern);
  if (patch.ignore !== undefined) {
    const seq = new YAMLSeq();
    for (const item of patch.ignore) seq.add(item);
    coll.set("ignore", seq);
  }

  const nextRaw = String(doc);
  const dir = path.dirname(indexPath);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.index.yml.${process.pid}.tmp`);
  await writeFile(tmp, nextRaw, "utf8");
  await rename(tmp, indexPath);

  return { baseHash: hashFileContents(nextRaw) };
}
