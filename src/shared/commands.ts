import { toDollarQuote } from "./shell.js";
import {
  collectionNameSchema,
  parseCollectionName,
  parsePositiveInt,
  searchModeSchema,
  typedQueryLineSchema,
} from "./validate.js";
import type { JobKind, SearchMode, TypedQueryLine } from "./types.js";

export type SearchOpts = {
  mode: SearchMode;
  query?: string;
  typedLines?: TypedQueryLine[];
  intent?: string;
  collections?: string[];
  n?: number;
  minScore?: number;
  all?: boolean;
  candidateLimit?: number;
  noRerank?: boolean;
  explain?: boolean;
  fullPath?: boolean;
};

export type CollectionAddOpts = {
  path: string;
  name: string;
  mask?: string;
};

export type CollectionRenameOpts = { from: string; to: string };
export type CollectionNameOpts = { name: string };
export type CollectionUpdateCmdOpts = { name: string; cmd?: string };

export type ContextAddOpts = { path: string; text: string };
export type ContextRmOpts = { path: string };

export type EmbedOpts = {
  collection?: string;
  force?: boolean;
  timeoutMin?: number;
  maxDocsPerBatch?: number;
};

export type PullOpts = { refresh?: boolean };

export type McpStartOpts = {
  port?: number;
  host?: string;
};

export type SkillInstallOpts = {
  global?: boolean;
  yes?: boolean;
  force?: boolean;
};

export function buildJobArgv(
  kind: JobKind,
  opts: Record<string, unknown>,
): string[] {
  switch (kind) {
    case "search":
    case "vsearch":
    case "query":
      return buildSearchArgv(kind, opts as SearchOpts);
    case "collection.add":
      return buildCollectionAddArgv(opts as CollectionAddOpts);
    case "collection.remove":
      return ["collection", "remove", parseCollectionName(String(opts.name))];
    case "collection.rename": {
      const o = opts as CollectionRenameOpts;
      return [
        "collection",
        "rename",
        parseCollectionName(o.from),
        parseCollectionName(o.to),
      ];
    }
    case "collection.include":
      return ["collection", "include", parseCollectionName(String(opts.name))];
    case "collection.exclude":
      return ["collection", "exclude", parseCollectionName(String(opts.name))];
    case "collection.updateCmd": {
      const o = opts as CollectionUpdateCmdOpts;
      const name = parseCollectionName(o.name);
      if (o.cmd === undefined || o.cmd === "") {
        return ["collection", "update-cmd", name];
      }
      return ["collection", "update-cmd", name, "--", o.cmd];
    }
    case "context.add": {
      const o = opts as ContextAddOpts;
      return ["context", "add", o.path, "--", o.text];
    }
    case "context.rm": {
      const o = opts as ContextRmOpts;
      return ["context", "rm", o.path];
    }
    case "update":
      return ["update"];
    case "embed":
      return buildEmbedArgv(opts as EmbedOpts);
    case "pull":
      return buildPullArgv(opts as PullOpts);
    case "cleanup":
      return ["cleanup"];
    case "cleanupDry":
      return ["cleanup", "--dry-run"];
    case "doctor":
      return ["doctor"];
    case "mcp.start":
      return buildMcpStartArgv(opts as McpStartOpts);
    case "mcp.stop":
      return ["mcp", "stop"];
    case "skill.install": {
      const o = opts as SkillInstallOpts;
      const args = ["skill", "install"];
      if (o.global) args.push("--global");
      if (o.yes) args.push("--yes");
      if (o.force) args.push("-f");
      return args;
    }
    default:
      throw new Error(`Unknown job kind: ${kind}`);
  }
}

export function buildSearchArgv(
  mode: SearchMode,
  opts: SearchOpts,
): string[] {
  searchModeSchema.parse(mode);
  const args: string[] = [mode, "--format", "json"];

  if (opts.collections?.length) {
    for (const c of opts.collections) {
      args.push("-c", parseCollectionName(c));
    }
  }
  if (opts.n !== undefined) args.push("-n", String(parsePositiveInt(opts.n, "n", 500)));
  if (opts.minScore !== undefined) {
    args.push("--min-score", String(opts.minScore));
  }
  if (opts.all) args.push("--all");
  if (mode === "query" || mode === "vsearch") {
    if (opts.intent) args.push("--intent", opts.intent);
  }
  if (mode === "query") {
    if (opts.candidateLimit !== undefined) {
      args.push("-C", String(parsePositiveInt(opts.candidateLimit, "candidateLimit", 500)));
    }
    if (opts.noRerank) args.push("--no-rerank");
  }
  if (opts.explain) args.push("--explain");
  if (opts.fullPath) args.push("--full-path");

  const queryArg = resolveSearchQueryArg(opts);
  args.push("--", queryArg);
  return args;
}

function resolveSearchQueryArg(opts: SearchOpts): string {
  if (opts.typedLines?.length) {
    const lines: string[] = [];
    for (const raw of opts.typedLines) {
      const line = typedQueryLineSchema.parse(raw);
      lines.push(`${line.type}:${line.query}`);
    }
    if (opts.intent) {
      if (lines.some((l) => l.startsWith("intent:"))) {
        throw new Error("Only one intent line allowed");
      }
      lines.push(`intent:${opts.intent}`);
    }
    if (lines.length === 1 && lines[0].startsWith("intent:")) {
      throw new Error("intent alone is invalid");
    }
    if (lines.some((l) => l.startsWith("expand:"))) {
      throw new Error("expand: cannot mix with typed lines");
    }
    return toDollarQuote(lines);
  }
  if (!opts.query?.trim()) {
    throw new Error("Query is required");
  }
  if (opts.query.includes("\n")) {
    throw new Error("Query cannot contain newlines unless using typed lines");
  }
  return opts.query;
}

function buildCollectionAddArgv(opts: CollectionAddOpts): string[] {
  collectionNameSchema.parse(opts.name);
  const args = ["collection", "add", opts.path, "--name", opts.name];
  if (opts.mask) args.push("--mask", opts.mask);
  return args;
}

function buildEmbedArgv(opts: EmbedOpts): string[] {
  const args = ["embed"];
  if (opts.force) args.push("-f");
  if (opts.collection) args.push("-c", parseCollectionName(opts.collection));
  if (opts.timeoutMin !== undefined) {
    args.push("--timeout", String(parsePositiveInt(opts.timeoutMin, "timeoutMin", 1440)));
  }
  if (opts.maxDocsPerBatch !== undefined) {
    args.push(
      "--max-docs-per-batch",
      String(parsePositiveInt(opts.maxDocsPerBatch, "maxDocsPerBatch", 10_000)),
    );
  }
  return args;
}

function buildPullArgv(opts: PullOpts): string[] {
  const args = ["pull"];
  if (opts.refresh) args.push("--refresh");
  return args;
}

function buildMcpStartArgv(opts: McpStartOpts): string[] {
  const args = ["mcp", "--http", "--daemon"];
  if (opts.port !== undefined) args.push("--port", String(opts.port));
  if (opts.host) args.push("--host", opts.host);
  return args;
}

export function isWriteJob(kind: JobKind): boolean {
  if (kind === "search" || kind === "vsearch" || kind === "query") {
    return false;
  }
  if (kind === "cleanupDry" || kind === "doctor") {
    return false;
  }
  return true;
}
