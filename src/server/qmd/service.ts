import { READ_JOB_TIMEOUT_MS } from "../../shared/constants.js";
import { QmdRunner } from "./runner.js";

export class QmdService {
  private readonly runner: QmdRunner;

  constructor(qmdBin: string) {
    this.runner = new QmdRunner(qmdBin);
  }

  async run(argv: string[], timeoutMs = READ_JOB_TIMEOUT_MS) {
    const result = await this.runner.run(argv, { timeoutMs });
    if (result.exitCode !== 0) {
      const err = new Error(result.stderr || result.stdout || `qmd exited ${result.exitCode}`);
      (err as Error & { exitCode: number }).exitCode = result.exitCode;
      throw err;
    }
    return result;
  }
}
