import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { ActivityProvider } from "@/context/activity";
import { AppLayout } from "@/layouts/AppLayout";
import { ApiError } from "@/lib/api.js";
import { isQmdUnavailable } from "@/lib/queries";
import {
  fetchCollections,
  fetchStatus,
  fetchSystem,
} from "@/lib/queries.js";
import { AgentsPage } from "@/pages/AgentsPage";
import { CollectionDetailPage } from "@/pages/CollectionDetailPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { ContextPage } from "@/pages/ContextPage";
import {
  FirstRun,
  resolveFirstRunStep,
  resolveHardAvailabilityStep,
} from "@/pages/FirstRun";
import { IndexPage } from "@/pages/IndexPage";
import { SearchPage } from "@/pages/SearchPage";

export function App() {
  return (
    <BrowserRouter>
      <ActivityProvider>
        <AppRoutes />
        <Toaster richColors position="top-center" />
      </ActivityProvider>
    </BrowserRouter>
  );
}

function connectionMessage(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return undefined;
}

function AppRoutes() {
  const systemQ = useQuery({
    queryKey: ["system"],
    queryFn: fetchSystem,
    retry: 1,
  });
  const hardStep = resolveHardAvailabilityStep(systemQ.data, systemQ.isError);

  const statusQ = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    enabled: hardStep === null && systemQ.data?.qmdFound === true,
    retry: (count, err) => !isQmdUnavailable(err) && count < 1,
  });
  const collectionsQ = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: hardStep === null && systemQ.data?.qmdFound === true,
    retry: (count, err) => !isQmdUnavailable(err) && count < 1,
  });

  const softStep =
    hardStep === null
      ? resolveFirstRunStep(
          systemQ.data,
          statusQ.data,
          collectionsQ.data,
          Boolean(statusQ.error),
        )
      : "ok";

  const softGate =
    softStep === "no-collections" || softStep === "needs-embed" ? softStep : null;

  if (systemQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            configPath={systemQ.data?.configPath}
            qmdVersion={systemQ.data?.version}
            pendingCount={
              hardStep === null ? statusQ.data?.pendingEmbeddings : undefined
            }
          />
        }
      >
        {hardStep ? (
          <Route
            path="*"
            element={
              <FirstRun
                step={hardStep}
                system={systemQ.data}
                connectionMessage={connectionMessage(systemQ.error)}
              />
            }
          />
        ) : (
          <>
            <Route index element={<Navigate to="/search" replace />} />
            <Route
              path="/search"
              element={
                <>
                  {softGate === "needs-embed" && (
                    <FirstRun step="needs-embed" system={systemQ.data} />
                  )}
                  <SearchPage />
                </>
              }
            />
            <Route
              path="/collections"
              element={
                <>
                  {softGate === "no-collections" && (
                    <FirstRun step="no-collections" system={systemQ.data} />
                  )}
                  <CollectionsPage />
                </>
              }
            />
            <Route path="/collections/:name" element={<CollectionDetailPage />} />
            <Route path="/context" element={<ContextPage />} />
            <Route path="/index" element={<IndexPage />} />
            <Route path="/agents" element={<AgentsPage />} />
          </>
        )}
      </Route>
    </Routes>
  );
}
