import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { CollectionsResponse, StatusInfo, SystemInfo } from "@/lib/queries.js";

export type FirstRunStep =
  | "ok"
  | "connection-error"
  | "missing-qmd"
  | "unsupported"
  | "no-collections"
  | "needs-embed";

export type HardAvailabilityStep =
  | "connection-error"
  | "missing-qmd"
  | "unsupported";

export function resolveHardAvailabilityStep(
  system: SystemInfo | undefined,
  systemQueryFailed: boolean,
): HardAvailabilityStep | null {
  if (systemQueryFailed) return "connection-error";
  if (!system) return "connection-error";
  if (!system.qmdFound) return "missing-qmd";
  if (!system.supported) return "unsupported";
  return null;
}

export function resolveFirstRunStep(
  system: SystemInfo | undefined,
  status: StatusInfo | undefined,
  collections: CollectionsResponse | undefined,
  statusError: boolean,
): FirstRunStep {
  const hard = resolveHardAvailabilityStep(system, false);
  if (hard) return hard;
  if (collections && collections.collections.length === 0) return "no-collections";
  if (statusError || !status) return "ok";
  const modelsMissing = !status.models?.embed;
  if (modelsMissing || status.pendingEmbeddings > 0) return "needs-embed";
  return "ok";
}

export function qmdRecoveryCommands(platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return [
      "where.exe qmd",
      '$env:QMD_GUI_QMD_BIN = "C:\\absolute\\path\\to\\qmd.cmd"',
      "qmd-gui start",
      "# or",
      "qmd-gui start --qmd C:\\absolute\\path\\to\\qmd.cmd",
    ].join("\n");
  }
  return [
    "command -v qmd",
    "QMD_GUI_QMD_BIN=/absolute/path/to/qmd qmd-gui start",
    "# or",
    "qmd-gui start --qmd /absolute/path/to/qmd",
  ].join("\n");
}

type Props = {
  step: FirstRunStep;
  system?: SystemInfo;
  connectionMessage?: string;
};

export function FirstRun({ step, system, connectionMessage }: Props) {
  if (step === "ok") return null;

  const platform = system?.platform ?? "linux";

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col justify-center">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        {step === "connection-error" && (
          <>
            <h1 className="text-xl font-semibold">Cannot connect to qmd-gui</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The browser could not reach the local API. Check that qmd-gui is
              running and reload this page.
            </p>
            {connectionMessage && (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-destructive">
                {connectionMessage}
              </p>
            )}
          </>
        )}
        {step === "missing-qmd" && (
          <>
            <h1 className="text-xl font-semibold">qmd is unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              qmd-gui shells out to the <code className="font-mono text-xs">qmd</code>{" "}
              CLI. At startup it did not find a binary on the process{" "}
              <code className="font-mono text-xs">PATH</code>. Install qmd or point
              qmd-gui at your executable, then restart qmd-gui.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              npm install -g @tobilu/qmd{"\n"}# or{"\n"}bun install -g @tobilu/qmd
            </pre>
            <p className="mt-4 text-sm font-medium">Already installed in your terminal?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The GUI inherits PATH from the process that started it, not from an
              interactive shell. Find the binary, set an override, and restart:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {qmdRecoveryCommands(platform)}
            </pre>
          </>
        )}
        {step === "unsupported" && (
          <>
            <h1 className="text-xl font-semibold">Unsupported qmd version</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Found <code className="font-mono">{system?.version ?? "unknown"}</code>.
              This UI targets qmd 2.8.x. Install a supported version, then restart
              qmd-gui.
            </p>
          </>
        )}
        {step === "no-collections" && (
          <>
            <h1 className="text-xl font-semibold">Add a collection</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your index has no collections yet. Add a folder of markdown to search.
            </p>
            <Button asChild className="mt-4">
              <Link to="/collections">Go to Collections</Link>
            </Button>
          </>
        )}
        {step === "needs-embed" && (
          <>
            <h1 className="text-xl font-semibold">Index needs embeddings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keyword search works now. Hybrid and vector search need embeddings
              (or models) from the Index page.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/index">Open Index</Link>
            </Button>
            <Button asChild className="mt-4 ml-2">
              <Link to="/search">Continue to Search</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
