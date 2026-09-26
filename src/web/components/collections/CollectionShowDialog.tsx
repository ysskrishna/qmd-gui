import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/QueryState";
import { fetchCollectionShow } from "@/lib/collections-api.js";

type Props = {
  name: string | null;
  onClose: () => void;
};

export function CollectionShowDialog({ name, onClose }: Props) {
  const q = useQuery({
    queryKey: ["collection-show", name],
    queryFn: () => fetchCollectionShow(name!),
    enabled: Boolean(name),
  });

  if (!name) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
        role="dialog"
        aria-labelledby="show-coll-title"
      >
        <h2 id="show-coll-title" className="text-lg font-semibold">
          {name}
        </h2>
        <p className="text-sm text-muted-foreground">From qmd collection show</p>
        <div className="mt-4">
        <QueryState loading={q.isLoading} error={q.error}>
          {q.data && (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Path</dt>
                <dd className="font-mono text-xs">{q.data.path}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pattern</dt>
                <dd className="font-mono text-xs">{q.data.pattern}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Default search</dt>
                <dd>{q.data.include ? "Included" : "Excluded"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Update command</dt>
                <dd className="font-mono text-xs">{q.data.updateCmd ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Context rows</dt>
                <dd>{q.data.contextCount}</dd>
              </div>
            </dl>
          )}
        </QueryState>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
