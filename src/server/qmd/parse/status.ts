export type ParsedStatus = {
  dbPath: string | null;
  sizeBytes: number | null;
  sizeLabel: string | null;
  totalFiles: number;
  vectors: number;
  pendingEmbeddings: number;
  orphanedVectors: number | null;
  updatedLabel: string | null;
  mcpPid: number | null;
  astActive: boolean;
  astLanguages: string[];
  tips: string[];
  models: { embed?: string; rerank?: string; generate?: string };
  collections: Array<{
    name: string;
    uri: string;
    pattern: string;
    files: number;
    updatedLabel: string | null;
    contextCount: number;
  }>;
};

const SIZE_RE = /^Size:\s+(.+)$/m;
const INDEX_RE = /^Index:\s+(.+)$/m;
const TOTAL_RE = /Total:\s+(\d+)\s+files indexed/;
const VECTORS_RE = /Vectors:\s+(\d+)\s+embedded/;
const PENDING_RE = /Pending:\s+(\d+)\s+need embedding/;
const ORPHAN_RE = /Orphaned:\s+(\d+)\s+embedding chunks/;
const UPDATED_RE = /Updated:\s+(.+)$/m;
const MCP_RE = /MCP:\s+.*\(PID\s+(\d+)\)/;
const AST_LANG_RE = /Languages:\s+(.+)$/m;

export function parseStatus(text: string): ParsedStatus {
  const dbPath = INDEX_RE.exec(text)?.[1]?.trim() ?? null;
  const sizeLabel = SIZE_RE.exec(text)?.[1]?.trim() ?? null;
  const totalFiles = Number(TOTAL_RE.exec(text)?.[1] ?? 0);
  const vectors = Number(VECTORS_RE.exec(text)?.[1] ?? 0);
  const pendingEmbeddings = Number(PENDING_RE.exec(text)?.[1] ?? 0);
  const orphaned = ORPHAN_RE.exec(text);
  const updatedLabel = UPDATED_RE.exec(text)?.[1]?.trim() ?? null;
  const mcpPid = Number(MCP_RE.exec(text)?.[1] ?? NaN);
  const astActive = /AST Chunking[\s\S]*?Status:\s+active/.test(text);
  const astLanguages =
    AST_LANG_RE.exec(text)?.[1]?.split(",").map((s) => s.trim()) ?? [];

  const tips: string[] = [];
  const tipsBlock = /Tips\n([\s\S]*?)(?:\n\nModels|\nModels|$)/.exec(text);
  if (tipsBlock?.[1]) {
    for (const line of tipsBlock[1].split("\n")) {
      const t = line.trim();
      if (t) tips.push(t);
    }
  }

  const models: ParsedStatus["models"] = {};
  const embed = /Embedding:\s+(\S+)/.exec(text)?.[1];
  const rerank = /Reranking:\s+(\S+)/.exec(text)?.[1];
  const generate = /Generation:\s+(\S+)/.exec(text)?.[1];
  if (embed) models.embed = embed;
  if (rerank) models.rerank = rerank;
  if (generate) models.generate = generate;

  const collections: ParsedStatus["collections"] = [];
  const collRe =
    /^\s{2}(\S+)\s+\(qmd:\/\/([^/]+)\/\)\n\s+Pattern:\s+(.+)\n\s+Files:\s+(\d+)(?:\s+\(updated\s+(.+)\))?\n\s+Contexts:\s+(\d+)/gm;
  let m: RegExpExecArray | null;
  while ((m = collRe.exec(text))) {
    collections.push({
      name: m[1],
      uri: `qmd://${m[2]}/`,
      pattern: m[3].trim(),
      files: Number(m[4]),
      updatedLabel: m[5]?.trim() ?? null,
      contextCount: Number(m[6] ?? 0),
    });
  }

  return {
    dbPath,
    sizeBytes: null,
    sizeLabel,
    totalFiles,
    vectors,
    pendingEmbeddings,
    orphanedVectors: orphaned ? Number(orphaned[1]) : null,
    updatedLabel,
    mcpPid: Number.isFinite(mcpPid) ? mcpPid : null,
    astActive,
    astLanguages,
    tips,
    models,
    collections,
  };
}
