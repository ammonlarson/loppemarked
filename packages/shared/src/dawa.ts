import { ELIGIBLE_STREET, HOUSE_NUMBER_MIN, HOUSE_NUMBER_MAX } from "./constants.js";

/** DAWA autocomplete suggestion from the /autocomplete endpoint */
export interface DawaAutocompleteSuggestion {
  tekst: string;
  adresse: {
    vejnavn: string;
    husnr: string;
    etage: string | null;
    dør: string | null;
    postnr: string;
    postnrnavn: string;
  };
}

/** DAWA address lookup result from the /adresser endpoint */
export interface DawaAddress {
  id: string;
  vejnavn: string;
  husnr: string;
  etage: string | null;
  dør: string | null;
  postnr: string;
  postnrnavn: string;
}

const DAWA_BASE_URL = "https://api.dataforsyningen.dk";

/**
 * Build a DAWA autocomplete URL scoped to the eligible street and house number range.
 * The frontend uses this to power the address selector/autocomplete input.
 */
export function buildDawaAutocompleteUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    vejnavn: ELIGIBLE_STREET,
    husnrfra: String(HOUSE_NUMBER_MIN),
    husnrtil: String(HOUSE_NUMBER_MAX),
    type: "adresse",
    fuzzy: "",
  });
  return `${DAWA_BASE_URL}/autocomplete?${params.toString()}`;
}

/**
 * Parse a DAWA house number string (e.g. "122", "138A") into a numeric value.
 * Returns null if the string cannot be parsed to a valid integer.
 */
export function parseDawaHouseNumber(husnr: string): number | null {
  const match = husnr.match(/^(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
