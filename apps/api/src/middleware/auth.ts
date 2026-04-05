import { unauthorized } from "../lib/errors.js";
import { parseSessionCookie, validateSession } from "../lib/session.js";
import type { RequestContext, RouteHandler, RouteResponse } from "../router.js";

export function requireAdmin(handler: RouteHandler): RouteHandler {
  return async (ctx: RequestContext): Promise<RouteResponse> => {
    const sessionId = parseSessionCookie(ctx.headers["cookie"]);
    if (!sessionId) {
      throw unauthorized();
    }

    const adminId = await validateSession(ctx.db, sessionId);
    if (!adminId) {
      throw unauthorized("Session expired or invalid");
    }

    ctx.adminId = adminId;
    return handler(ctx);
  };
}
