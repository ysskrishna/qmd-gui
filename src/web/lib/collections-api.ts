import { apiFetch } from "./api.js";

export type CollectionShow = {
  name: string;
  path: string;
  pattern: string;
  include: boolean;
  updateCmd: string | null;
  contextCount: number;
};

export type LsEntry = {
  sizeBytes: number;
  modifiedLabel: string;
  uri: string;
  path: string;
};

export type CollectionConfigResponse = {
  baseHash: string;
  path: string;
  pattern: string;
  ignore: string[];
  includeByDefault: boolean;
  update: string;
};

export function fetchCollectionShow(name: string) {
  return apiFetch<CollectionShow>(`/api/collections/${encodeURIComponent(name)}`);
}

export function fetchCollectionConfig(name: string) {
  return apiFetch<CollectionConfigResponse>(
    `/api/collections/${encodeURIComponent(name)}/config`,
  );
}

export function fetchCollectionFiles(name: string, prefix = "") {
  const q = prefix ? `?path=${encodeURIComponent(prefix)}` : "";
  return apiFetch<{ files: LsEntry[] }>(
    `/api/collections/${encodeURIComponent(name)}/files${q}`,
  );
}

export type FsDirsResponse = {
  path: string;
  parent: string;
  dirs: Array<{ name: string; path: string }>;
};

export function fetchFsDirs(dirPath?: string) {
  const q = dirPath ? `?path=${encodeURIComponent(dirPath)}` : "";
  return apiFetch<FsDirsResponse>(`/api/fs/dirs${q}`);
}

export async function pickFolderNative(): Promise<string> {
  const res = await apiFetch<{ path: string }>("/api/pick-folder", {
    method: "POST",
  });
  return res.path;
}
