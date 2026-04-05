import { describe, expect, it } from "vitest";
import { buildDawaAutocompleteUrl, parseDawaHouseNumber } from "./dawa.js";

describe("buildDawaAutocompleteUrl", () => {
  it("includes the query parameter", () => {
    const url = buildDawaAutocompleteUrl("Else");
    expect(url).toContain("q=Else");
  });

  it("scopes to Else Alfelts Vej", () => {
    const url = buildDawaAutocompleteUrl("test");
    expect(url).toContain("vejnavn=Else+Alfelts+Vej");
  });

  it("includes house number range", () => {
    const url = buildDawaAutocompleteUrl("test");
    expect(url).toContain("husnrfra=122");
    expect(url).toContain("husnrtil=202");
  });

  it("sets type to adresse", () => {
    const url = buildDawaAutocompleteUrl("test");
    expect(url).toContain("type=adresse");
  });

  it("uses the DAWA base URL", () => {
    const url = buildDawaAutocompleteUrl("test");
    expect(url).toMatch(/^https:\/\/api\.dataforsyningen\.dk\/autocomplete\?/);
  });
});

describe("parseDawaHouseNumber", () => {
  it("parses a plain number", () => {
    expect(parseDawaHouseNumber("122")).toBe(122);
  });

  it("parses a number with letter suffix", () => {
    expect(parseDawaHouseNumber("138A")).toBe(138);
  });

  it("returns null for non-numeric input", () => {
    expect(parseDawaHouseNumber("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDawaHouseNumber("")).toBeNull();
  });
});
