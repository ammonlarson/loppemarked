import type { RouteResponse } from "../router.js";

export async function handleHealth(): Promise<RouteResponse> {
  return {
    statusCode: 200,
    body: { status: "ok" },
  };
}
