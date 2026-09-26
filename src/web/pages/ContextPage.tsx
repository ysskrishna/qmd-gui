import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { apiFetch } from "@/lib/api.js";

type ContextResponse = {
  rows: Array<{ collection: string; path: string; text: string }>;
};

export function ContextPage() {
  const q = useQuery({
    queryKey: ["context"],
    queryFn: () => apiFetch<ContextResponse>("/api/context"),
  });

  return (
    <>
      <PageHeader
        title="Context"
        description="Descriptions attached to collections and paths. From qmd context list."
      />
      <QueryState loading={q.isLoading} error={q.error}>
        <QueryState empty={!q.data?.rows.length} emptyMessage="No context rows yet.">
          <ul className="space-y-2">
            {q.data?.rows.map((row, i) => (
              <li key={i} className="rounded-lg border border-border px-4 py-3 text-sm">
                <p className="font-mono text-xs text-muted-foreground">
                  {row.collection}
                  {row.path}
                </p>
                <p className="mt-1">{row.text}</p>
              </li>
            ))}
          </ul>
        </QueryState>
      </QueryState>
    </>
  );
}
