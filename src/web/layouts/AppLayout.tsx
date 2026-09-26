import {
  Bot,
  Database,
  FolderOpen,
  MessageSquare,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { ActivityPanel } from "@/components/ActivityPanel";
import { useActivity } from "@/context/activity";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/collections", label: "Collections", icon: FolderOpen },
  { to: "/context", label: "Context", icon: MessageSquare },
  { to: "/index", label: "Index", icon: Database, pendingBadge: true },
  { to: "/agents", label: "AI agents", icon: Bot },
] as const;

type Props = {
  configPath?: string;
  qmdVersion?: string | null;
  pendingCount?: number;
};

export function AppLayout({ configPath, qmdVersion, pendingCount }: Props) {
  const { theme, toggle } = useTheme();
  const { jobs, open, setOpen } = useActivity();

  return (
    <div className="grid h-screen grid-cols-[240px_1fr] overflow-hidden">
      <aside className="flex min-h-0 flex-col border-r border-border bg-[var(--sidebar,#fafafa)] dark:bg-[var(--sidebar,#0f0f0f)]">
        <div className="flex items-center gap-2 px-4 pb-1 pt-3.5 font-semibold tracking-tight">
          <span className="grid size-[22px] place-items-center rounded-md bg-primary font-mono text-[11px] text-primary-foreground">
            q
          </span>
          qmd-gui
        </div>
        {configPath && (
          <div className="mx-2.5 mb-1 mt-2 rounded-[10px] border border-border bg-card px-2.5 py-2">
            <p className="text-[13px] font-medium">Default index</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {configPath}
            </p>
          </div>
        )}
        <nav className="flex flex-col gap-0.5 px-2.5 py-2">
          {NAV.map((item) => {
            const { to, label, icon: Icon } = item;
            const pendingBadge = "pendingBadge" in item && item.pendingBadge;
            return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="flex-1">{label}</span>
              {pendingBadge && pendingCount !== undefined && pendingCount > 0 && (
                <span
                  className="rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[11.5px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                  title="Documents need embedding"
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>qmd {qmdVersion ?? "—"}</span>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md hover:bg-accent"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </aside>
      <div className="relative flex min-h-0 min-w-0 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[980px] px-8 py-7 pb-12">
            <Outlet />
          </div>
        </main>
        <ActivityPanel open={open} onToggle={() => setOpen(!open)} jobs={jobs} />
      </div>
    </div>
  );
}
