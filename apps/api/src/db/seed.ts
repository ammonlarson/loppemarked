import type { Kysely } from "kysely";
import {
  BOX_CATALOG,
  DEFAULT_OPENING_DATETIME,
  GREENHOUSES,
  OPENING_TIMEZONE,
  SEED_ADMIN_EMAILS,
} from "@greenspace/shared";

import type { Database } from "./types.js";

/**
 * Return greenhouse seed rows.
 */
export function getGreenhouseRows(): Array<{ name: string }> {
  return GREENHOUSES.map((name) => ({ name }));
}

/**
 * Return planter box seed rows.
 */
export function getBoxRows(): Array<{
  id: number;
  name: string;
  greenhouse_name: string;
  state: "available";
}> {
  return BOX_CATALOG.map((box) => ({
    id: box.id,
    name: box.name,
    greenhouse_name: box.greenhouse,
    state: "available" as const,
  }));
}

/**
 * Return admin seed rows. Passwords must be hashed before insertion.
 */
export function getAdminEmails(): readonly string[] {
  return SEED_ADMIN_EMAILS;
}

/**
 * Seed the database with initial data.
 * Requires a password hash function to be provided (avoids bundling bcrypt/argon2 here).
 */
export async function seed(
  db: Kysely<Database>,
  hashPassword: (password: string) => Promise<string>,
  initialPassword: string,
): Promise<void> {
  // Seed greenhouses
  const greenhouseRows = getGreenhouseRows();
  await db
    .insertInto("greenhouses")
    .values(greenhouseRows)
    .onConflict((oc) => oc.column("name").doNothing())
    .execute();

  // Seed planter boxes
  const boxRows = getBoxRows();
  await db
    .insertInto("planter_boxes")
    .values(boxRows)
    .onConflict((oc) => oc.column("id").doNothing())
    .execute();

  // Seed system settings (opening datetime)
  // Use the default opening datetime interpreted in Copenhagen timezone
  const openingTimestamp = `${DEFAULT_OPENING_DATETIME} ${OPENING_TIMEZONE}`;
  const existing = await db
    .selectFrom("system_settings")
    .select("id")
    .executeTakeFirst();

  if (!existing) {
    await db
      .insertInto("system_settings")
      .values({ opening_datetime: openingTimestamp })
      .execute();
  }

  // Seed initial admin accounts
  const passwordHash = await hashPassword(initialPassword);

  for (const email of SEED_ADMIN_EMAILS) {
    const existingAdmin = await db
      .selectFrom("admins")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (!existingAdmin) {
      const [admin] = await db
        .insertInto("admins")
        .values({ email })
        .returning("id")
        .execute();

      await db
        .insertInto("admin_credentials")
        .values({
          admin_id: admin.id,
          password_hash: passwordHash,
        })
        .execute();
    }
  }
}
