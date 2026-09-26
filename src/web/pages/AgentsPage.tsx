import { CommandPreview } from "@/components/CommandPreview";
import { PageHeader } from "@/components/PageHeader";
import { buildJobArgv } from "@shared/commands.js";

export function AgentsPage() {
  return (
    <>
      <PageHeader
        title="AI agents"
        description="MCP HTTP server and skill install for Claude, Cursor, and other agents."
      />
      <CommandPreview argv={buildJobArgv("mcp.start", { port: 8181 })} />
      <p className="mt-4 text-sm text-muted-foreground">
        MCP controls and stdio snippet arrive in Phase 6.
      </p>
    </>
  );
}
