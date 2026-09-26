import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, subscribeJobEvents } from "@/lib/api.js";
import type { JobKind } from "@shared/types.js";

export type ActivityLine = {
  line: string;
  stream: "stdout" | "stderr";
};

export type ActivityJob = {
  id: string;
  kind: JobKind | string;
  argv: string[];
  lines: ActivityLine[];
  running: boolean;
  exitCode?: number;
};

type ActivityContextValue = {
  jobs: ActivityJob[];
  open: boolean;
  setOpen: (open: boolean) => void;
  runJob: (
    kind: JobKind,
    opts: Record<string, unknown>,
  ) => Promise<ActivityJob & { result?: unknown }>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<ActivityJob[]>([]);
  const [open, setOpen] = useState(false);

  const runJob = useCallback(async (kind: JobKind, opts: Record<string, unknown>) => {
    const res = await apiFetch<{ jobId: string; argv: string[] }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ kind, opts }),
    });
    const job: ActivityJob = {
      id: res.jobId,
      kind,
      argv: res.argv,
      lines: [],
      running: true,
    };
    setJobs((prev) => [job, ...prev].slice(0, 50));
    setOpen(true);

    return await new Promise<ActivityJob & { result?: unknown }>((resolve) => {
      subscribeJobEvents(res.jobId, {
        onLine: (line) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === res.jobId ? { ...j, lines: [...j.lines, line] } : j,
            ),
          );
        },
        onDone: ({ exitCode, result }) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === res.jobId ? { ...j, running: false, exitCode } : j,
            ),
          );
          resolve({ ...job, exitCode, result });
        },
      });
    });
  }, []);

  const value = useMemo(
    () => ({ jobs, open, setOpen, runJob }),
    [jobs, open, runJob],
  );

  return (
    <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity outside provider");
  return ctx;
}
