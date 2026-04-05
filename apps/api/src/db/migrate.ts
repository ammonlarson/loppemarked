import { FileMigrationProvider, Migrator } from "kysely";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Kysely } from "kysely";
import type { Database } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createMigrator(db: Kysely<Database>): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });
}

export async function migrateToLatest(
  db: Kysely<Database>,
): Promise<{ success: boolean; executedMigrations: string[] }> {
  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateToLatest();

  const executedMigrations = (results ?? [])
    .filter((r) => r.status === "Success")
    .map((r) => r.migrationName);

  if (error) {
    throw error;
  }

  return { success: true, executedMigrations };
}

export async function migrateDown(
  db: Kysely<Database>,
): Promise<{ success: boolean; executedMigrations: string[] }> {
  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateDown();

  const executedMigrations = (results ?? [])
    .filter((r) => r.status === "Success")
    .map((r) => r.migrationName);

  if (error) {
    throw error;
  }

  return { success: true, executedMigrations };
}
