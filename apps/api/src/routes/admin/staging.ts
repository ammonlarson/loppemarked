import { BOX_CATALOG, ELIGIBLE_STREET, normalizeApartmentKey } from "@loppemarked/shared";
import { logAuditEvent } from "../../lib/audit.js";
import { badRequest, unauthorized } from "../../lib/errors.js";
import type { RequestContext, RouteResponse } from "../../router.js";

function isStagingEnvironment(): boolean {
  return process.env["ENVIRONMENT"] === "staging";
}

export async function handleFillBoxes(ctx: RequestContext): Promise<RouteResponse> {
  const adminId = ctx.adminId;
  if (!adminId) {
    throw unauthorized();
  }

  if (!isStagingEnvironment()) {
    throw badRequest("This action is only available in the staging environment");
  }

  const body = (ctx.body ?? {}) as { confirm?: boolean };
  if (!body.confirm) {
    throw badRequest("Confirmation is required to fill all boxes with fake registrations");
  }

  let filledCount = 0;

  await ctx.db.transaction().execute(async (trx) => {
    const boxes = await trx
      .selectFrom("planter_boxes")
      .select(["id", "state"])
      .where("state", "!=", "occupied")
      .orderBy("id", "asc")
      .execute();

    for (const box of boxes) {
      const catalog = BOX_CATALOG.find((b) => b.id === box.id);
      if (!catalog) continue;

      const houseNumber = 122 + ((box.id - 1) * 2) % 80;
      const floor = houseNumber >= 161 ? String(((box.id - 1) % 4) + 1) : null;
      const door = houseNumber >= 161 ? (box.id % 2 === 0 ? "th" : "tv") : null;
      const apartmentKey = normalizeApartmentKey(ELIGIBLE_STREET, houseNumber, floor, door);

      await trx
        .insertInto("registrations")
        .values({
          box_id: box.id,
          name: `Test User ${box.id}`,
          email: `testuser${box.id}@staging.example.com`,
          street: ELIGIBLE_STREET,
          house_number: houseNumber,
          floor,
          door,
          apartment_key: apartmentKey,
          language: box.id % 2 === 0 ? "en" : "da",
          status: "active",
        })
        .execute();

      await trx
        .updateTable("planter_boxes")
        .set({ state: "occupied", reserved_label: null, updated_at: new Date().toISOString() })
        .where("id", "=", box.id)
        .execute();

      filledCount++;
    }

    await logAuditEvent(trx, {
      actor_type: "admin",
      actor_id: adminId,
      action: "staging_fill_boxes",
      entity_type: "system",
      entity_id: "staging",
      after: { filled_count: filledCount, total_boxes: BOX_CATALOG.length },
    });
  });

  return {
    statusCode: 200,
    body: { filledCount, totalBoxes: BOX_CATALOG.length },
  };
}

export async function handleClearRegistrations(ctx: RequestContext): Promise<RouteResponse> {
  const adminId = ctx.adminId;
  if (!adminId) {
    throw unauthorized();
  }

  if (!isStagingEnvironment()) {
    throw badRequest("This action is only available in the staging environment");
  }

  const body = (ctx.body ?? {}) as { confirm?: boolean };
  if (!body.confirm) {
    throw badRequest("Confirmation is required to clear all registrations");
  }

  let clearedCount = 0;

  await ctx.db.transaction().execute(async (trx) => {
    const activeRegs = await trx
      .selectFrom("registrations")
      .select(["id", "box_id"])
      .where("status", "=", "active")
      .execute();

    clearedCount = activeRegs.length;

    if (activeRegs.length > 0) {
      await trx
        .updateTable("registrations")
        .set({ status: "removed", updated_at: new Date().toISOString() })
        .where("status", "=", "active")
        .execute();

      const occupiedBoxIds = activeRegs.map((r) => r.box_id);
      await trx
        .updateTable("planter_boxes")
        .set({ state: "available", reserved_label: null, updated_at: new Date().toISOString() })
        .where("id", "in", occupiedBoxIds)
        .execute();
    }

    await logAuditEvent(trx, {
      actor_type: "admin",
      actor_id: adminId,
      action: "staging_clear_registrations",
      entity_type: "system",
      entity_id: "staging",
      after: { cleared_count: clearedCount },
    });
  });

  return {
    statusCode: 200,
    body: { clearedCount },
  };
}
