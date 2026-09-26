import { spawn } from "node:child_process";

export function spawnQmd(
  qmdBin: string,
  argv: string[],
  options: { env?: NodeJS.ProcessEnv; cwd?: string } = {},
) {
  const spawnOpts = {
    shell: false,
    env: options.env,
    cwd: options.cwd,
  };
  if (qmdBin.endsWith(".mjs") || qmdBin.endsWith(".js")) {
    return spawn(process.execPath, [qmdBin, ...argv], spawnOpts);
  }
  return spawn(qmdBin, argv, spawnOpts);
}
