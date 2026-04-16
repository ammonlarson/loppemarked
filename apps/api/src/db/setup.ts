import { createDatabase } from "./connection.js";
import { migrateToLatest } from "./migrate.js";
import { seed } from "./seed.js";
import { hashPassword } from "../lib/password.js";
import { logger } from "../lib/logger.js";

const INITIAL_PASSWORD = process.env["SEED_ADMIN_PASSWORD"] ?? "changeme123";

async function main() {
  const db = createDatabase({
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? "5432"),
    database: process.env["DB_NAME"] ?? "loppemarked",
    user: process.env["DB_USER"] ?? "loppemarked",
    password: process.env["DB_PASSWORD"] ?? "",
    ssl: process.env["DB_SSL"] === "true",
  });

  logger.info("Running migrations...");
  const { executedMigrations } = await migrateToLatest(db);
  if (executedMigrations.length > 0) {
    logger.info(`Applied: ${executedMigrations.join(", ")}`);
  } else {
    logger.info("Already up to date.");
  }

  logger.info("Seeding database...");
  await seed(db, hashPassword, INITIAL_PASSWORD);
  logger.info("Seed complete.");

  await db.destroy();
}

main().catch((err) => {
  logger.error("Setup failed:", err);
  process.exit(1);
});
