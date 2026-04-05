import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { Database } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let _rdsCaCert: string | undefined;
function getRdsCaCert(): string {
  if (!_rdsCaCert) {
    _rdsCaCert = readFileSync(resolve(__dirname, "rds-global-bundle.pem"), "utf-8");
  }
  return _rdsCaCert;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export function createDatabase(config: DatabaseConfig): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: true, ca: getRdsCaCert() } : undefined,
        max: 10,
      }),
    }),
  });
}
