export type LsEntry = {
  sizeBytes: number;
  modifiedLabel: string;
  uri: string;
  path: string;
};

const LS_RE =
  /^(\d+)\s+B\s{2}(.+?)\s{2}(.+)$/;

export function parseLs(text: string): LsEntry[] {
  const entries: LsEntry[] = [];
  for (const line of text.split("\n")) {
    const m = LS_RE.exec(line.trim());
    if (!m) continue;
    const uri = m[3].trim();
    const path = uri.replace(/^qmd:\/\/[^/]+\//, "");
    entries.push({
      sizeBytes: Number(m[1]),
      modifiedLabel: m[2].trim(),
      uri,
      path,
    });
  }
  return entries;
}
