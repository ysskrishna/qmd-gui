import os from "node:os";
import path from "node:path";
import { CACHE_DIR_NAME, PID_FILE_NAME } from "../shared/constants.js";

export function resolveConfigDir(overrides?: {
  qmdConfigDir?: string;
  home?: string;
  xdgConfigHome?: string;
}): string {
  if (overrides?.qmdConfigDir) return overrides.qmdConfigDir;
  if (process.env.QMD_CONFIG_DIR) return process.env.QMD_CONFIG_DIR;
  const home = overrides?.home ?? process.env.HOME ?? os.homedir();
  const xdg =
    overrides?.xdgConfigHome ??
    process.env.XDG_CONFIG_HOME ??
    path.join(home, ".config");
  return path.join(xdg, "qmd");
}

export function resolveIndexYmlPath(configDir?: string): string {
  return path.join(resolveConfigDir(configDir ? { qmdConfigDir: configDir } : undefined), "index.yml");
}

export function resolveGuiCacheDir(home?: string): string {
  const h = home ?? process.env.HOME ?? os.homedir();
  const xdgCache = process.env.XDG_CACHE_HOME ?? path.join(h, ".cache");
  return path.join(xdgCache, CACHE_DIR_NAME);
}

export function resolvePidFilePath(home?: string): string {
  return path.join(resolveGuiCacheDir(home), PID_FILE_NAME);
}
