import type { SettingsPlanStep } from "@shared/plan-settings.js";
import type { JobKind } from "@shared/types.js";
import { apiFetch } from "./api.js";

export async function executeSettingsPlan(
  collectionName: string,
  steps: SettingsPlanStep[],
  startBaseHash: string,
  runJob: (
    kind: JobKind,
    opts: Record<string, unknown>,
  ) => Promise<{ exitCode?: number }>,
): Promise<string> {
  let baseHash = startBaseHash;
  for (const step of steps) {
    if (step.type === "yaml") {
      const res = await apiFetch<{ baseHash: string }>(
        `/api/collections/${encodeURIComponent(collectionName)}/config`,
        {
          method: "PUT",
          body: JSON.stringify({ baseHash, ...step.patch }),
        },
      );
      baseHash = res.baseHash;
      continue;
    }
    const job = await runJob(step.kind, step.opts);
    if (job.exitCode !== 0) {
      throw new Error(`${step.label} failed (exit ${job.exitCode})`);
    }
  }
  return baseHash;
}
