import { handler as coreHandler } from "./index.js";
import type { LambdaEvent, LambdaResponse } from "./index.js";

interface FunctionUrlEvent {
  version?: string;
  rawPath?: string;
  requestContext?: { http?: { method?: string; path?: string } };
  headers?: Record<string, string>;
  body?: string | null;
  isBase64Encoded?: boolean;
  httpMethod?: string;
  path?: string;
}

function isNonHttpEvent(event: unknown): boolean {
  const e = event as Record<string, unknown>;
  return (
    ("action" in e && e.action === "migrate") ||
    ("detail-type" in e && e["detail-type"] === "Scheduled Event")
  );
}

export async function handler(event: FunctionUrlEvent): Promise<LambdaResponse> {
  if (isNonHttpEvent(event)) {
    return coreHandler(event as unknown as LambdaEvent);
  }

  return coreHandler({
    httpMethod: event.httpMethod ?? event.requestContext?.http?.method ?? "GET",
    path: event.path ?? event.rawPath ?? "/",
    headers: (event.headers ?? {}) as Record<string, string | undefined>,
    body:
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, "base64").toString()
        : (event.body ?? null),
  });
}
