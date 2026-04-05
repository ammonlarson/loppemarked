import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE waitlist_entries
    ADD COLUMN greenhouse_preference VARCHAR(20) NOT NULL DEFAULT 'any'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE waitlist_entries
    DROP COLUMN greenhouse_preference
  `.execute(db);
}
