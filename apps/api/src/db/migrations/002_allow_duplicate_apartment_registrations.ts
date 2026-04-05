import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS uq_registrations_active_apartment`.execute(db);
}

// NOTE: down() will fail if duplicate active registrations exist for any apartment_key.
// Clean up duplicate data before rolling back this migration.
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE UNIQUE INDEX uq_registrations_active_apartment ON registrations (apartment_key) WHERE status = 'active'`.execute(
    db,
  );
}
