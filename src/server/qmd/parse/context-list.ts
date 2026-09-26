export type ContextRow = {
  collection: string;
  path: string;
  text: string;
  isGlobal: boolean;
};

export function parseContextList(text: string): ContextRow[] {
  const rows: ContextRow[] = [];
  const lines = text.split("\n");
  let collection: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed === "Configured Contexts") continue;

    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      collection = trimmed === "/" ? "/" : trimmed;
      continue;
    }

    const pathLine = /^\s{2}(.+)$/.exec(line);
    if (!pathLine || !collection) continue;
    const pathRaw = pathLine[1].trim();
    if (!pathRaw.includes("(root)") && !pathRaw.startsWith("/")) continue;

    const path = pathRaw.replace(/\s*\(root\)\s*/i, "").trim() || "/";
    const textLine = lines[i + 1];
    const textMatch = textLine ? /^\s{4}(.+)$/.exec(textLine) : null;
    if (!textMatch) continue;

    rows.push({
      collection,
      path,
      text: textMatch[1].trim(),
      isGlobal: collection === "/",
    });
    i++;
  }

  return rows;
}
