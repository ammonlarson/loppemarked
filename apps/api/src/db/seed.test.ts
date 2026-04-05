import { describe, expect, it } from "vitest";
import {
  BOX_CATALOG,
  GREENHOUSES,
  SEED_ADMIN_EMAILS,
  TOTAL_BOX_COUNT,
  KRONEN_BOX_RANGE,
  SOEN_BOX_RANGE,
} from "@loppemarked/shared";

import { getGreenhouseRows, getBoxRows, getAdminEmails } from "./seed.js";

describe("seed data", () => {
  describe("getGreenhouseRows", () => {
    it("returns one row per greenhouse", () => {
      const rows = getGreenhouseRows();
      expect(rows).toHaveLength(GREENHOUSES.length);
      expect(rows.map((r) => r.name)).toEqual([...GREENHOUSES]);
    });
  });

  describe("getBoxRows", () => {
    const rows = getBoxRows();

    it("returns exactly 29 boxes", () => {
      expect(rows).toHaveLength(TOTAL_BOX_COUNT);
    });

    it("has continuous IDs from 1 to 29", () => {
      const ids = rows.map((r) => r.id);
      for (let i = 1; i <= 29; i++) {
        expect(ids).toContain(i);
      }
    });

    it("assigns Kronen boxes to IDs 1-14", () => {
      const kronenBoxes = rows.filter((r) => r.greenhouse_name === "Kronen");
      expect(kronenBoxes).toHaveLength(
        KRONEN_BOX_RANGE.end - KRONEN_BOX_RANGE.start + 1,
      );
      for (const box of kronenBoxes) {
        expect(box.id).toBeGreaterThanOrEqual(KRONEN_BOX_RANGE.start);
        expect(box.id).toBeLessThanOrEqual(KRONEN_BOX_RANGE.end);
      }
    });

    it("assigns Søen boxes to IDs 15-29", () => {
      const soenBoxes = rows.filter((r) => r.greenhouse_name === "Søen");
      expect(soenBoxes).toHaveLength(
        SOEN_BOX_RANGE.end - SOEN_BOX_RANGE.start + 1,
      );
      for (const box of soenBoxes) {
        expect(box.id).toBeGreaterThanOrEqual(SOEN_BOX_RANGE.start);
        expect(box.id).toBeLessThanOrEqual(SOEN_BOX_RANGE.end);
      }
    });

    it("matches the shared BOX_CATALOG exactly", () => {
      for (const catalogEntry of BOX_CATALOG) {
        const row = rows.find((r) => r.id === catalogEntry.id);
        expect(row).toBeDefined();
        expect(row!.name).toBe(catalogEntry.name);
        expect(row!.greenhouse_name).toBe(catalogEntry.greenhouse);
      }
    });

    it("sets all boxes to available state", () => {
      for (const row of rows) {
        expect(row.state).toBe("available");
      }
    });

    it("has unique box names", () => {
      const names = rows.map((r) => r.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe("getAdminEmails", () => {
    it("returns the configured seed admin emails", () => {
      const emails = getAdminEmails();
      expect(emails).toEqual(SEED_ADMIN_EMAILS);
      expect(emails).toHaveLength(1);
    });

    it("contains valid email addresses", () => {
      for (const email of getAdminEmails()) {
        expect(email).toMatch(/.+@.+\..+/);
      }
    });
  });
});
