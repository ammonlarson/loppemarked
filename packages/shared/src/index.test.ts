import { describe, expect, it } from "vitest";
import {
  GREENHOUSES,
  BOX_CATALOG,
  BOX_STATES,
  LANGUAGES,
  AUDIT_ACTIONS,
  validateEmail,
  normalizeApartmentKey,
  I18N_KEYS,
  LANGUAGE_LABELS,
} from "./index.js";

describe("barrel exports", () => {
  it("exports greenhouse names", () => {
    expect(GREENHOUSES).toEqual(["Kronen", "Søen"]);
  });

  it("exports box catalog with 29 entries", () => {
    expect(BOX_CATALOG).toHaveLength(29);
  });

  it("exports box states", () => {
    expect(BOX_STATES).toEqual(["available", "occupied", "reserved"]);
  });

  it("exports languages", () => {
    expect(LANGUAGES).toEqual(["da", "en"]);
  });

  it("exports audit actions", () => {
    expect(AUDIT_ACTIONS.length).toBeGreaterThan(0);
    expect(AUDIT_ACTIONS).toContain("registration_create");
  });

  it("exports validators", () => {
    expect(validateEmail("test@example.com")).toEqual({ valid: true });
  });

  it("exports normalizeApartmentKey", () => {
    expect(normalizeApartmentKey("Else Alfelts Vej", 130, null, null)).toBe(
      "else alfelts vej 130",
    );
  });

  it("exports i18n keys", () => {
    expect(I18N_KEYS.common.appName).toBe("common.appName");
  });

  it("exports language labels", () => {
    expect(LANGUAGE_LABELS.da).toBe("Dansk");
    expect(LANGUAGE_LABELS.en).toBe("English");
  });
});
