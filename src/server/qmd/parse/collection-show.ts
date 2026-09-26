export type CollectionShow = {
  name: string;
  path: string;
  pattern: string;
  include: boolean;
  updateCmd: string | null;
  contextCount: number;
};

export function parseCollectionShow(text: string): CollectionShow {
  const name = /^Collection:\s+(\S+)/m.exec(text)?.[1] ?? "";
  const path = /^\s+Path:\s+(.+)$/m.exec(text)?.[1]?.trim() ?? "";
  const pattern = /^\s+Pattern:\s+(.+)$/m.exec(text)?.[1]?.trim() ?? "";
  const includeLine = /^\s+Include:\s+(.+)$/m.exec(text)?.[1] ?? "";
  const include = !/no/i.test(includeLine);
  const updateCmd = /^\s+Update:\s+(.+)$/m.exec(text)?.[1]?.trim() ?? null;
  const contextCount = Number(
    /^\s+Contexts:\s+(\d+)/m.exec(text)?.[1] ?? 0,
  );
  return { name, path, pattern, include, updateCmd, contextCount };
}
