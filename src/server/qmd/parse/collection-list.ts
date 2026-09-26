export type CollectionListRow = {
  name: string;
  uri: string;
  pattern: string;
  files: number;
  updatedLabel: string | null;
  excluded: boolean;
};

export function parseCollectionList(text: string): CollectionListRow[] {
  const rows: CollectionListRow[] = [];
  const re =
    /^(\S+)\s+\(qmd:\/\/([^/]+)\/\)\s*(\[excluded\])?\n\s+Pattern:\s+(.+)\n\s+Files:\s+(\d+)(?:\n\s+Updated:\s+(.+))?/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    rows.push({
      name: m[1],
      uri: `qmd://${m[2]}/`,
      excluded: Boolean(m[3]),
      pattern: m[4].trim(),
      files: Number(m[5]),
      updatedLabel: m[6]?.trim() ?? null,
    });
  }
  return rows;
}
