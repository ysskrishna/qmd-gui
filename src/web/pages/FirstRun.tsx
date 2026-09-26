import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { CollectionsResponse, StatusInfo, SystemInfo } from "@/lib/queries.js";

export type FirstRunStep =
  | "ok"
  | "missing-qmd"
  | "unsupported"
  | "no-collections"
  | "needs-embed";

export function resolveFirstRunStep(
  system: SystemInfo | undefined,
  status: StatusInfo | undefined,
  collections: CollectionsResponse | undefined,
  statusError: boolean,
): FirstRunStep {
  if (!system?.qmdFound) return "missing-qmd";
  if (!system.supported) return "unsupported";
  if (collections && collections.collections.length === 0) return "no-collections";
  if (statusError || !status) return "ok";
  const modelsMissing = !status.models?.embed;
  if (modelsMissing || status.pendingEmbeddings > 0) return "needs-embed";
  return "ok";
}

type Props = {
  step: FirstRunStep;
  system?: SystemInfo;
};

export function FirstRun({ step, system }: Props) {
  if (step === "ok") return null;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        {step === "missing-qmd" && (
          <>
            <h1 className="text-xl font-semibold">Install qmd</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              qmd-gui shells out to the <code className="font-mono text-xs">qmd</code>{" "}
              CLI. It was not found on your PATH.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              npm install -g @tobilu/qmd{"\n"}# or{"\n"}bun install -g @tobilu/qmd
            </pre>
          </>
        )}
        {step === "unsupported" && (
          <>
            <h1 className="text-xl font-semibold">Unsupported qmd version</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Found <code className="font-mono">{system?.version ?? "unknown"}</code>.
              This UI targets qmd 2.8.x. Upgrade or downgrade qmd, then reload.
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
