import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";
import {
  QMD_VERSION_MAX_EXCLUSIVE,
  QMD_VERSION_MIN,
} from "../../shared/constants.js";

export type QmdDetectResult = {
  qmdBin: string | null;
  version: string | null;
  supported: boolean;
};

const ENV_BIN = "QMD_GUI_QMD_BIN";

export async function resolveQmdBin(
  explicit?: string,
): Promise<string | null> {
  if (explicit) return await executable(explicit) ? explicit : null;
  const fromEnv = process.env[ENV_BIN];
  if (fromEnv && (await executable(fromEnv))) return fromEnv;

  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, process.platform === "win32" ? "qmd.cmd" : "qmd");
    if (await executable(candidate)) return candidate;
    const plain = path.join(dir, "qmd");
    if (await executable(plain)) return plain;
  }
  return null;
}

async function executable(file: string): Promise<boolean> {
  try {
    await access(file, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function detectQmd(explicitBin?: string): Promise<QmdDetectResult> {
  const qmdBin = await resolveQmdBin(explicitBin);
  if (!qmdBin) {
    return { qmdBin: null, version: null, supported: false };
  }
  const version = await readVersion(qmdBin);
  const supported =
    version !== null && semverInRange(version, QMD_VERSION_MIN, QMD_VERSION_MAX_EXCLUSIVE);
  return { qmdBin, version, supported };
}

async function readVersion(qmdBin: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(qmdBin, ["--version"], {
      shell: false,
      env: qmdChildEnv(),
    });
    let out = "";
    child.stdout.on("data", (c) => {
      out += String(c);
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) resolve(null);
      else resolve(parseVersionLine(out));
    });
  });
}

export function parseVersionLine(text: string): string | null {
  const m = text.match(/(\d+\.\d+\.\d+)/);
  return m?.[1] ?? null;
}

export function semverInRange(
  version: string,
  minInclusive: string,
  maxExclusive: string,
): boolean {
  return (
    compareSemver(version, minInclusive) >= 0 &&
    compareSemver(version, maxExclusive) < 0
  );
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function qmdChildEnv(): NodeJS.ProcessEnv {
  const keep = [
    "PATH",
    "HOME",
    "USER",
    "LANG",
    "LC_ALL",
    "TMPDIR",
    "TEMP",
    "TMP",
    "XDG_CONFIG_HOME",
    "XDG_CACHE_HOME",
    "XDG_DATA_HOME",
  ];
  const env: NodeJS.ProcessEnv = { NO_COLOR: "1" };
  for (const key of keep) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("QMD_") && value !== undefined) env[key] = value;
  }
  return env;
}
