import type { Kysely } from "kysely";
import type { Database } from "./db/types.js";
import { AppError, methodNotAllowed, notFound, toErrorBody } from "./lib/errors.js";
import { logger } from "./lib/logger.js";

export interface RequestContext {
  db: Kysely<Database>;
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string | undefined>;
  adminId?: string;
  params: Record<string, string>;
}

export interface RouteResponse {
  statusCode: number;
  body: unknown;
  headers?: Record<string, string>;
}

export type RouteHandler = (ctx: RequestContext) => Promise<RouteResponse>;

interface Route {
  method: string;
  path: string;
  segments: string[];
  handler: RouteHandler;
}

function matchRoute(
  routeSegments: string[],
  pathSegments: string[],
): Record<string, string> | null {
  if (routeSegments.length !== pathSegments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i++) {
    const seg = routeSegments[i];
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = pathSegments[i];
    } else if (seg !== pathSegments[i]) {
      return null;
    }
  }
  return params;
}

export class Router {
  private routes: Route[] = [];

  get(path: string, handler: RouteHandler): void {
    this.routes.push({ method: "GET", path, segments: path.split("/"), handler });
  }

  post(path: string, handler: RouteHandler): void {
    this.routes.push({ method: "POST", path, segments: path.split("/"), handler });
  }

  patch(path: string, handler: RouteHandler): void {
    this.routes.push({ method: "PATCH", path, segments: path.split("/"), handler });
  }

  delete(path: string, handler: RouteHandler): void {
    this.routes.push({ method: "DELETE", path, segments: path.split("/"), handler });
  }

  async handle(ctx: RequestContext): Promise<RouteResponse> {
    try {
      const pathSegments = ctx.path.split("/");
      const matchingRoutes: { route: Route; params: Record<string, string> }[] = [];

      for (const route of this.routes) {
        const params = matchRoute(route.segments, pathSegments);
        if (params !== null) {
          matchingRoutes.push({ route, params });
        }
      }

      if (matchingRoutes.length === 0) {
        throw notFound();
      }

      const match = matchingRoutes.find((m) => m.route.method === ctx.method);
      if (!match) {
        throw methodNotAllowed();
      }

      ctx.params = match.params;
      return await match.route.handler(ctx);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return {
          statusCode: err.statusCode,
          body: toErrorBody(err),
        };
      }

      logger.error("Unhandled error", err);
      return {
        statusCode: 500,
        body: { error: "Internal server error" },
      };
    }
  }
}
