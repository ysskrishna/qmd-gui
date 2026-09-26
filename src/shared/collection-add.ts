export function defaultCollectionName(dirPath: string): string {
  const trimmed = dirPath.replace(/\/$/, "");
  const base = trimmed.split(/[/\\]/).pop() || "root";
  return base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 64) || "collection";
}

const MD_FILE = /\.(md|markdown)$/i;

export function validateCollectionAddPath(
  inputPath: string,
): { ok: true; path: string } | { ok: false; error: string } {
  const trimmed = inputPath.trim();
  if (!trimmed) return { ok: false, error: "Path is required" };
  if (MD_FILE.test(trimmed)) {
    return {
      ok: false,
      error:
        "Pick the folder, not a single .md file — put the file name in the pattern instead.",
    };
  }
  return { ok: true, path: trimmed };
}
