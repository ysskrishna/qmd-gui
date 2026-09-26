import { CommandPreview } from "@/components/CommandPreview";
import { PageHeader } from "@/components/PageHeader";
import { buildSearchArgv } from "@shared/commands.js";

export function SearchPage() {
  const previewArgv = buildSearchArgv("search", {
    mode: "search",
    query: "your query",
  });
  return (
    <>
      <PageHeader
        title="Search"
        description={
          <>
            Runs <code className="font-mono text-xs">qmd search</code>,{" "}
            <code className="font-mono text-xs">vsearch</code>, or{" "}
            <code className="font-mono text-xs">query</code>. Full UI in Phase 4.
          </>
        }
      />
      <CommandPreview argv={previewArgv} />
      <p className="mt-4 text-sm text-muted-foreground">
        Search form and results will land here next.
      </p>
    </>
  );
}
