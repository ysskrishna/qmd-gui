import type { ReactNode } from "react";
import { ApiError } from "@/lib/api.js";
import { isQmdUnavailable } from "@/lib/queries.js";

type Props = {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function QueryState({
  loading,
  error,
  empty,
  emptyMessage = "Nothing here yet.",
  children,
}: Props) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading…
      </p>
    );
  }
  if (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Something went wrong.";
    const hint = isQmdUnavailable(error)
      ? "Install qmd globally, then reload."
      : undefined;
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <p className="font-medium text-destructive">{message}</p>
        {hint && <p className="mt-1 text-muted-foreground">{hint}</p>}
      </div>
    );
  }
  if (empty) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return children;
}
