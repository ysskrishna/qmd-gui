import { useQuery } from "@tanstack/react-query";
import { CommandPreview } from "@/components/CommandPreview";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useActivity } from "@/context/activity";
import { Button } from "@/components/ui/button";
import { fetchStatus } from "@/lib/queries.js";

export function IndexPage() {
  const q = useQuery({ queryKey: ["status"], queryFn: fetchStatus });
  const { runJob } = useActivity();

  return (
    <>
      <PageHeader
        title="Index"
        description="Health and upkeep. Numbers from qmd status."
      />
      <QueryState loading={q.isLoading} error={q.error}>
        {q.data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Files" value={String(q.data.totalFiles)} />
            <Stat
              label="Need embedding"
              value={String(q.data.pendingEmbeddings)}
            />
            <Stat label="Index size" value={q.data.sizeLabel ?? "—"} />
          </div>
        )}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Maintenance</p>
          <CommandPreview argv={["update"]} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void runJob("doctor", {})}
          >
            Run doctor
          </Button>
        </div>
      </QueryState>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
