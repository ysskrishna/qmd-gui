import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  hashFileContents,
  readIndexYml,
  writeCollectionFields,
} from "../../src/server/config.js";

const tmpRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".tmp-config",
);

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await rm(tmpRoot, { recursive: true, force: true });
});

describe("config", () => {
  it("resolves config dir from QMD_CONFIG_DIR", async () => {
    const { resolveConfigDir } = await import("../../src/server/paths.js");
    const prev = process.env.QMD_CONFIG_DIR;
    process.env.QMD_CONFIG_DIR = "/tmp/custom-qmd";
    expect(resolveConfigDir()).toBe("/tmp/custom-qmd");
    process.env.QMD_CONFIG_DIR = prev;
  });

  it("preserves comments and unrelated keys on patch", async () => {
    await mkdir(tmpRoot, { recursive: true });
    const indexPath = path.join(tmpRoot, "index.yml");
    const initial = `# header comment
global_context: "keep me"
collections:
  notes:
    path: /old
    pattern: "**/*.md"
`;
    await writeFile(indexPath, initial, "utf8");
    const { baseHash } = await readIndexYml(indexPath);
    await writeCollectionFields(indexPath, "notes", { path: "/new" }, baseHash);
    const next = await readFile(indexPath, "utf8");
    expect(next).toContain("# header comment");
    expect(next).toContain("global_context");
    expect(next).toContain("/new");
    expect(hashFileContents(next)).not.toBe(baseHash);
  });

  it("returns 409 when baseHash is stale", async () => {
    await mkdir(tmpRoot, { recursive: true });
    const indexPath = path.join(tmpRoot, "index.yml");
    await writeFile(indexPath, "collections: {}\n", "utf8");
    const { baseHash } = await readIndexYml(indexPath);
    await writeFile(indexPath, "collections:\n  x: {}\n", "utf8");
    await expect(
      writeCollectionFields(indexPath, "notes", { path: "/x" }, baseHash),
    ).rejects.toMatchObject({ status: 409 });
  });
});
