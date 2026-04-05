import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { InlineMigrationProvider } from "./migration-registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

function getFileSystemMigrationNames(): string[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => f.replace(/\.ts$/, ""))
    .sort();
}

describe("migration registry", () => {
  it("registers every migration file from the migrations directory", async () => {
    const filesystemNames = getFileSystemMigrationNames();
    const provider = new InlineMigrationProvider();
    const registeredMigrations = await provider.getMigrations();
    const registeredNames = Object.keys(registeredMigrations).sort();

    expect(registeredNames).toEqual(filesystemNames);
  });

  it("has no stale entries that do not correspond to migration files", async () => {
    const filesystemNames = new Set(getFileSystemMigrationNames());
    const provider = new InlineMigrationProvider();
    const registeredMigrations = await provider.getMigrations();

    for (const name of Object.keys(registeredMigrations)) {
      expect(filesystemNames.has(name), `Registry entry "${name}" has no matching migration file`).toBe(true);
    }
  });

  it("has no migration files missing from the registry", async () => {
    const filesystemNames = getFileSystemMigrationNames();
    const provider = new InlineMigrationProvider();
    const registeredMigrations = await provider.getMigrations();
    const registeredNames = new Set(Object.keys(registeredMigrations));

    for (const name of filesystemNames) {
      expect(registeredNames.has(name), `Migration file "${name}" is not registered in InlineMigrationProvider`).toBe(true);
    }
  });

  it("registers migrations with valid up and down functions", async () => {
    const provider = new InlineMigrationProvider();
    const registeredMigrations = await provider.getMigrations();

    for (const [name, migration] of Object.entries(registeredMigrations)) {
      expect(typeof migration.up, `Migration "${name}" is missing an up() function`).toBe("function");
      expect(typeof migration.down, `Migration "${name}" is missing a down() function`).toBe("function");
    }
  });
});
