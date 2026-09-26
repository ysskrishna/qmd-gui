import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolvePidFilePath } from "./paths.js";

export type PidFilePayload = {
  pid: number;
  host: string;
  port: number;
};

export async function writePidFile(
  payload: PidFilePayload,
  home?: string,
): Promise<string> {
  const file = resolvePidFilePath(home);
  await mkdir(file.replace(/\/[^/]+$/, ""), { recursive: true });
  await writeFile(file, JSON.stringify(payload), "utf8");
  return file;
}

export async function readPidFile(home?: string): Promise<PidFilePayload | null> {
  const file = resolvePidFilePath(home);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as PidFilePayload;
  } catch {
    return null;
  }
}

export async function removePidFile(home?: string): Promise<void> {
  const file = resolvePidFilePath(home);
  try {
    await unlink(file);
  } catch {
    /* ignore */
  }
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
