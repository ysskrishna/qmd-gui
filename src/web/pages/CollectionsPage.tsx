import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { fetchCollections } from "@/lib/queries.js";

export function CollectionsPage() {
  const q = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  return (
    <>
      <PageHeader
        title="Collections"
        description="Folders qmd indexes. From qmd collection list and index.yml."
      />
      <QueryState loading={q.isLoading} error={q.error}>
        <QueryState empty={!q.data?.collections.length} emptyMessage="No collections yet.">
          <ul className="divide-y rounded-lg border border-border">
            {q.data?.collections.map((c) => (
              <li key={c.name} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{c.name}</span>
                {c.excluded && (
                  <span className="text-xs text-muted-foreground">excluded from default search</span>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </QueryState>
    </>
  );
}
