import { unauthorized } from "../../lib/errors.js";
import type { RequestContext, RouteResponse } from "../../router.js";

export async function handleListWaitlist(ctx: RequestContext): Promise<RouteResponse> {
  if (!ctx.adminId) {
    throw unauthorized();
  }

  const entries = await ctx.db
    .selectFrom("waitlist_entries")
    .select([
      "id",
      "name",
      "email",
      "street",
      "house_number",
      "floor",
      "door",
      "apartment_key",
      "language",
      "greenhouse_preference",
      "status",
      "created_at",
      "updated_at",
    ])
    .orderBy("created_at", "asc")
    .execute();

  return {
    statusCode: 200,
    body: entries,
  };
}
