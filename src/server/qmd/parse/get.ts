export type ParsedGet = {
  uri: string;
  docid: string | null;
  folderContext: string | null;
  lines: Array<{ number: number; text: string }>;
  rawBody: string;
};

const HEADER_RE = /^(qmd:\/\/\S+)\s*(#\S+)?/;
const FOLDER_CTX_RE = /^Folder Context:\s*(.*)$/m;

export function parseGet(text: string): ParsedGet {
  const parts = text.split("\n---\n");
  const headerBlock = parts[0] ?? "";
  const body = parts.slice(1).join("\n---\n");

  const firstLine = headerBlock.split("\n")[0] ?? "";
  const header = HEADER_RE.exec(firstLine);
  const uri = header?.[1] ?? "";
  const docid = header?.[2] ?? null;
  const folderContext = FOLDER_CTX_RE.exec(headerBlock)?.[1]?.trim() ?? null;

  const lines: ParsedGet["lines"] = [];
  for (const line of body.split("\n")) {
    const m = /^(\d+):\s?(.*)$/.exec(line);
    if (m) lines.push({ number: Number(m[1]), text: m[2] });
  }

  return { uri, docid, folderContext, lines, rawBody: body };
}
