"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDawaAutocompleteUrl,
  parseDawaHouseNumber,
  isFloorDoorRequired,
  type DawaAutocompleteSuggestion,
} from "@loppemarked/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts, shadows } from "@/styles/theme";

export interface DawaAddressResult {
  houseNumber: number;
  floor: string | null;
  door: string | null;
  displayText: string;
}

interface DawaAddressInputProps {
  onSelect: (address: DawaAddressResult) => void;
  onClear: () => void;
  selectedAddress: DawaAddressResult | null;
}

export function DawaAddressInput({ onSelect, onClear, selectedAddress }: DawaAddressInputProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DawaAutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = buildDawaAutocompleteUrl(q);
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const data: DawaAutocompleteSuggestion[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setHighlightIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  }

  function handleSelectSuggestion(suggestion: DawaAutocompleteSuggestion) {
    const addr = suggestion.adresse;
    const parsed = parseDawaHouseNumber(addr.husnr);
    if (!parsed) {
      setSuggestions([]);
      setShowDropdown(false);
      setQuery("");
      return;
    }

    const result: DawaAddressResult = {
      houseNumber: parsed,
      floor: addr.etage,
      door: addr.dør,
      displayText: suggestion.tekst,
    };

    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    onSelect(result);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  if (selectedAddress) {
    const needsFloorDoor = isFloorDoorRequired(selectedAddress.houseNumber);
    const hasFloor = selectedAddress.floor != null && selectedAddress.floor.trim().length > 0;
    const hasDoor = selectedAddress.door != null && selectedAddress.door.trim().length > 0;
    const hasFloorDoor = hasFloor && hasDoor;

    return (
      <div style={{ marginBottom: "1rem", fontFamily: fonts.body }}>
        <span style={labelStyle}>{t("address.selectedAddress")}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 0.75rem",
            background: colors.lightSage,
            border: `1px solid ${colors.sage}`,
            borderRadius: 6,
            fontSize: "0.95rem",
            color: colors.inkBrown,
          }}
        >
          <span>{selectedAddress.displayText}</span>
          <button
            type="button"
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: colors.warmBrown,
              cursor: "pointer",
              fontSize: "0.85rem",
              fontFamily: fonts.body,
              textDecoration: "underline",
            }}
          >
            {t("address.changeAddress")}
          </button>
        </div>
        {needsFloorDoor && !hasFloorDoor && (
          <p style={{ color: colors.dustyRose, fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            {t("address.floorDoorHint")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", marginBottom: "1rem", fontFamily: fonts.body }}>
      <label htmlFor="dawa-address" style={labelStyle}>
        {t("registration.streetLabel")} *
      </label>
      <p style={{ fontSize: "0.8rem", color: colors.warmBrown, margin: "0 0 0.25rem" }}>
        {t("address.searchHint")}
      </p>
      <input
        id="dawa-address"
        type="text"
        required
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={t("address.searchPlaceholder")}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="dawa-suggestions"
        aria-activedescendant={highlightIndex >= 0 ? `dawa-suggestion-${highlightIndex}` : undefined}
        style={inputStyle}
      />

      {loading && (
        <span style={{ position: "absolute", right: 12, top: "50%", fontSize: "0.8rem", color: colors.warmBrown }}>
          {t("common.loading")}
        </span>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ul
          id="dawa-suggestions"
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: colors.white,
            border: `1px solid ${colors.borderTan}`,
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 10,
            boxShadow: shadows.card,
          }}
        >
          {suggestions.map((s, i) => (
            <li
              id={`dawa-suggestion-${i}`}
              key={`${s.tekst}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseDown={() => handleSelectSuggestion(s)}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                background: i === highlightIndex ? colors.lightSage : colors.white,
                fontSize: "0.9rem",
                borderBottom: i < suggestions.length - 1 ? `1px solid ${colors.parchment}` : "none",
                color: colors.inkBrown,
              }}
            >
              {s.tekst}
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim().length >= 2 && suggestions.length === 0 && showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            padding: "0.5rem 0.75rem",
            background: colors.white,
            border: `1px solid ${colors.borderTan}`,
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            fontSize: "0.85rem",
            color: colors.warmBrown,
            zIndex: 10,
          }}
        >
          {t("address.noResults")}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.9rem",
  fontWeight: 500,
  marginBottom: "0.25rem",
  color: colors.warmBrown,
  fontFamily: fonts.body,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: `1px solid ${colors.borderTan}`,
  borderRadius: 6,
  fontFamily: fonts.body,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  color: colors.inkBrown,
  background: colors.white,
};
