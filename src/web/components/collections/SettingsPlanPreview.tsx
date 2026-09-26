import { buildJobArgv } from "@shared/commands.js";
import type { SettingsPlanStep } from "@shared/plan-settings.js";
import { CommandPreview } from "@/components/CommandPreview";

type Props = {
  steps: SettingsPlanStep[];
};

export function SettingsPlanPreview({ steps }: Props) {
  if (!steps.length) {
    return (
      <p className="text-sm text-muted-foreground">Nothing changed yet.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {steps.map((step, i) => (
        <li key={i}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {i + 1}. {step.label}
          </p>
          {step.type === "job" ? (
            <CommandPreview argv={buildJobArgv(step.kind, step.opts)} />
          ) : (
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-xs">
              {JSON.stringify(step.patch, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}
