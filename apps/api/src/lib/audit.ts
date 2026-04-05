import type { Kysely, Transaction } from "kysely";
import type { Database } from "../db/types.js";

interface AuditEventInput {
  actor_type: "public" | "admin" | "system";
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
}

export async function logAuditEvent(
  db: Kysely<Database> | Transaction<Database>,
  input: AuditEventInput,
): Promise<void> {
  await db
    .insertInto("audit_events")
    .values({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
      reason: input.reason ?? null,
    })
    .execute();
}
