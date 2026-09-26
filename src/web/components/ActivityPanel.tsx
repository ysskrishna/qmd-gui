import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityJob } from "@/context/activity.js";

type Props = {
  open: boolean;
  onToggle: () => void;
  jobs: ActivityJob[];
};

export function ActivityPanel({ open, onToggle, jobs }: Props) {
  const active = jobs.find((j) => j.running);
  const latest = jobs[0];

  return (
    <div className="border-t border-border bg-[var(--term,#0a0a0a)] text-[var(--term-fg,#d4d4d4)]">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 opacity-70" />
        ) : (
          <ChevronUp className="size-4 opacity-70" />
        )}
        <span className="font-medium">Activity</span>
        {active && (
          <span className="text-xs text-amber-400">Running…</span>
        )}
        {latest?.exitCode !== undefined && !active && (
          <ExitBadge code={latest.exitCode} />
        )}
      </button>
      {open && (
        <div className="max-h-56 overflow-y-auto px-4 pb-3 font-mono text-xs leading-relaxed">
          {jobs.length === 0 && (
            <p className="text-neutral-500">No commands yet.</p>
          )}
          {jobs.map((job) => (
            <div key={job.id} className="mb-3 border-b border-white/10 pb-2">
              <div className="mb-1 flex items-center gap-2 text-neutral-400">
                <span>{job.kind}</span>
                {job.exitCode !== undefined && <ExitBadge code={job.exitCode} />}
              </div>
              {job.lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    line.stream === "stderr" ? "text-red-300" : "text-neutral-200",
                  )}
                >
                  {line.line || " "}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExitBadge({ code }: { code: number }) {
  const ok = code === 0;
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[11px] font-medium",
        ok ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300",
      )}
    >
      exit {code}
    </span>
  );
}
