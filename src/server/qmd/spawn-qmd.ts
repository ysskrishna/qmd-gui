import { spawn } from "node:child_process";

export function spawnQmd(
  qmdBin: string,
  argv: string[],
  options: { env?: NodeJS.ProcessEnv } = {},
) {
  if (qmdBin.endsWith(".mjs") || qmdBin.endsWith(".js")) {
    return spawn(process.execPath, [qmdBin, ...argv], {
      shell: false,
      env: options.env,
    });
  }
  return spawn(qmdBin, argv, { shell: false, env: options.env });
}
