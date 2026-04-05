import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE admin_notification_preferences (
      admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      notify_user_registration BOOLEAN NOT NULL DEFAULT true,
      notify_admin_box_action BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (admin_id)
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS admin_notification_preferences`.execute(db);
}
