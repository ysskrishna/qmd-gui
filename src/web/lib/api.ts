export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (res.status === 403) {
    throw new ApiError("Forbidden (invalid Host).", 403, body);
  }
  if (res.status === 409) {
    throw new ApiError("Conflict — config changed on disk.", 409, body);
  }
  if (res.status === 503) {
    const msg =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof (body as { error: string }).error === "string"
        ? (body as { error: string }).error
        : "qmd is unavailable.";
    throw new ApiError(msg, 503, body);
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof (body as { error: string }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

export type SseHandlers = {
  onLine?: (data: { line: string; stream: "stdout" | "stderr" }) => void;
  onDone?: (data: { exitCode: number; result?: unknown }) => void;
  onError?: (err: Error) => void;
};

export function subscribeJobEvents(
  jobId: string,
  handlers: SseHandlers,
): () => void {
  const url = `/api/jobs/${jobId}/events`;
  let closed = false;
  let retryMs = 500;

  const streamWithFetch = async () => {
    while (!closed) {
      try {
        const res = await fetch(url, {
          headers: { Accept: "text/event-stream" },
        });
        if (!res.ok || !res.body) {
          throw new ApiError(`SSE failed (${res.status})`, res.status);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            parseSseChunk(chunk, handlers);
          }
        }
        if (!closed) {
          await sleep(retryMs);
          retryMs = Math.min(retryMs * 2, 8_000);
        }
      } catch (err) {
        if (closed) break;
        handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
        await sleep(retryMs);
        retryMs = Math.min(retryMs * 2, 8_000);
      }
    }
  };

  void streamWithFetch();
  return () => {
    closed = true;
  };
}

function parseSseChunk(chunk: string, handlers: SseHandlers) {
  let event = "message";
  let data = "";
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    if (event === "line") handlers.onLine?.(parsed);
    if (event === "done") handlers.onDone?.(parsed);
  } catch {
    /* ignore */
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
