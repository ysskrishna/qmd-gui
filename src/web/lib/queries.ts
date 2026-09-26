import { apiFetch, ApiError } from "./api.js";

export type SystemInfo = {
  qmdFound: boolean;
  version: string | null;
  supported: boolean;
  configPath: string;
  dbPath: string | null;
};

export type StatusInfo = {
  pendingEmbeddings: number;
  totalFiles: number;
  models: { embed?: string; rerank?: string; generate?: string };
  dbPath: string | null;
  sizeLabel: string | null;
};

export type CollectionRow = {
  name: string;
  uri: string;
  pattern: string;
  files: number;
  updatedLabel: string | null;
  excluded: boolean;
  config: {
    path?: unknown;
    pattern?: unknown;
    ignore?: unknown;
    includeByDefault?: unknown;
  } | null;
};

export type CollectionsResponse = {
  collections: CollectionRow[];
};

export function fetchSystem() {
  return apiFetch<SystemInfo>("/api/system");
}

export function fetchStatus() {
  return apiFetch<StatusInfo>("/api/status");
}

export function fetchCollections() {
  return apiFetch<CollectionsResponse>("/api/collections");
}

export function isQmdUnavailable(err: unknown) {
  return err instanceof ApiError && err.status === 503;
}
