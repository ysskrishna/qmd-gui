import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CommandPreview } from "@/components/CommandPreview";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity";
import { fetchStatus, fetchSystem } from "@/lib/queries.js";
import { buildJobArgv } from "@shared/commands.js";
import { DEFAULT_MCP_PORT } from "@shared/constants.js";
import { cn } from "@/lib/utils";

const STDIO_SNIPPET = JSON.stringify(
  { mcpServers: { qmd: { command: "qmd", args: ["mcp"] } } },
  null,
  2,
);

export function AgentsPage() {
  const statusQ = useQuery({ queryKey: ["status"], queryFn: fetchStatus });
  const systemQ = useQuery({ queryKey: ["system"], queryFn: fetchSystem });
  const queryClient = useQueryClient();
  const { runJob } = useActivity();

  const [mcpPort, setMcpPort] = useState(String(DEFAULT_MCP_PORT));
  const [mcpHost, setMcpHost] = useState("127.0.0.1");
  const [skillGlobal, setSkillGlobal] = useState(false);
  const [skillYes, setSkillYes] = useState(true);
  const [skillForce, setSkillForce] = useState(false);
  const [skillCwd, setSkillCwd] = useState("");

  const mcpRunning = Boolean(statusQ.data?.mcpPid);
  const guiPort = systemQ.data?.guiPort ?? null;
  const portNum = Number(mcpPort) || DEFAULT_MCP_PORT;
  const portClash = guiPort !== null && portNum === guiPort;

  const mcpArgv = useMemo(
    () =>
      buildJobArgv("mcp.start", {
        port: portNum,
        host: mcpHost.trim() || undefined,
      }),
    [portNum, mcpHost],
  );

  const skillOpts = useMemo(() => {
    const o: Record<string, unknown> = {
      global: skillGlobal,
      yes: skillYes,
      force: skillForce,
    };
    if (!skillGlobal && skillCwd.trim()) o.cwd = skillCwd.trim();
    return o;
  }, [skillGlobal, skillYes, skillForce, skillCwd]);

  async function startMcp() {
    if (portClash) {
      toast.error(`MCP port ${portNum} matches the GUI port. Pick another port.`);
      return;
    }
    const job = await runJob("mcp.start", {
      port: portNum,
      host: mcpHost.trim() || undefined,
    });
    if (job.exitCode !== 0) {
      toast.error(`MCP start failed (exit ${job.exitCode})`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["status"] });
    toast.success("MCP server started");
  }

  async function stopMcp() {
    const job = await runJob("mcp.stop", {});
    if (job.exitCode !== 0) {
      toast.error(`MCP stop failed (exit ${job.exitCode})`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["status"] });
    toast.success("MCP server stopped");
  }

  async function installSkill() {
    const job = await runJob("skill.install", skillOpts);
    if (job.exitCode !== 0) {
      toast.error(`Skill install failed (exit ${job.exitCode})`);
      return;
    }
    toast.success("Skill install finished");
  }

  async function copyStdio() {
    await navigator.clipboard.writeText(STDIO_SNIPPET);
    toast.success("Copied MCP stdio config");
  }

  const httpUrl = `http://${mcpHost || "localhost"}:${portNum}/mcp`;

  return (
    <>
      <PageHeader
        title="AI agents"
        description="MCP HTTP server and skill install for Claude, Cursor, and other agents."
      />

      <QueryState loading={statusQ.isLoading} error={statusQ.error}>
        <section className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">MCP server (HTTP)</h2>
              <p className="text-sm text-muted-foreground">
                Agents connect to <code className="font-mono text-xs">{httpUrl}</code>
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                mcpRunning
                  ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {mcpRunning
                ? `Running · PID ${statusQ.data?.mcpPid}`
                : "Stopped"}
            </span>
          </div>

          {portClash && (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
              MCP port {portNum} is the same as the GUI port ({guiPort}). Use a different MCP port.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Port</span>
              <input
                type="number"
                className="mt-1 block h-9 w-28 rounded-md border border-input bg-background px-2"
                value={mcpPort}
                disabled={mcpRunning}
                onChange={(e) => setMcpPort(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Host</span>
              <input
                className="mt-1 block h-9 w-48 rounded-md border border-input bg-background px-2 font-mono text-sm"
                value={mcpHost}
                disabled={mcpRunning}
                onChange={(e) => setMcpHost(e.target.value)}
                placeholder="127.0.0.1"
              />
            </label>
          </div>

          <CommandPreview
            argv={mcpRunning ? buildJobArgv("mcp.stop", {}) : mcpArgv}
            className="mt-3"
          />

          <div className="mt-4 flex justify-end gap-2">
            {mcpRunning ? (
              <Button type="button" variant="destructive" onClick={() => void stopMcp()}>
                Stop server
              </Button>
            ) : (
              <Button type="button" onClick={() => void startMcp()}>
                Start server
              </Button>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">MCP over stdio</h2>
              <p className="text-sm text-muted-foreground">
                Paste into your agent&apos;s MCP config. No server to start here.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyStdio()}>
              Copy
            </Button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
            {STDIO_SNIPPET}
          </pre>
        </section>

        <section className="mt-6 rounded-lg border border-border p-4">
          <h2 className="font-medium">Agent skill</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <code className="font-mono text-xs">qmd skill install</code> — teaches agents how to use qmd.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!skillGlobal}
                onChange={() => setSkillGlobal(false)}
              />
              This project folder
            </label>
            {!skillGlobal && (
              <input
                className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 font-mono text-sm"
                placeholder="/path/to/your/project"
                value={skillCwd}
                onChange={(e) => setSkillCwd(e.target.value)}
              />
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={skillGlobal}
                onChange={() => setSkillGlobal(true)}
              />
              Global (--global)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skillYes}
                onChange={(e) => setSkillYes(e.target.checked)}
              />
              Non-interactive (--yes)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skillForce}
                onChange={(e) => setSkillForce(e.target.checked)}
              />
              Overwrite (-f)
            </label>
          </div>
          <CommandPreview argv={buildJobArgv("skill.install", skillOpts)} className="mt-3" />
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => void installSkill()}>
              Install skill
            </Button>
          </div>
        </section>
      </QueryState>
    </>
  );
}
