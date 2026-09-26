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

export type CollectionsResponse = {
  collections: Array<{ name: string; excluded: boolean }>;
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
