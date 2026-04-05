"use client";

import { colors, fonts } from "@/styles/theme";
import { useLanguage } from "@/i18n/LanguageProvider";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface TableControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  hasActiveControls: boolean;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

const controlInputStyle: React.CSSProperties = {
  padding: "0.35rem 0.5rem",
  border: `1px solid ${colors.borderTan}`,
  borderRadius: 4,
  fontSize: "0.8rem",
  fontFamily: fonts.body,
  color: colors.inkBrown,
  background: colors.white,
  boxSizing: "border-box",
};

export function TableControls({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  hasActiveControls,
  onClearAll,
  resultCount,
  totalCount,
}: TableControlsProps) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "0.75rem",
      }}
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder ?? t("admin.table.searchPlaceholder")}
        aria-label={t("admin.table.searchPlaceholder")}
        style={{ ...controlInputStyle, minWidth: 180, flex: "0 1 auto" }}
      />
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          aria-label={f.label}
          style={controlInputStyle}
        >
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActiveControls && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            padding: "0.35rem 0.75rem",
            border: `1px solid ${colors.borderTan}`,
            borderRadius: 4,
            background: colors.white,
            color: colors.warmBrown,
            cursor: "pointer",
            fontSize: "0.8rem",
            fontFamily: fonts.body,
          }}
        >
          {t("admin.table.clearFilters")}
        </button>
      )}
      {hasActiveControls && resultCount !== totalCount && (
        <span style={{ fontSize: "0.8rem", color: colors.warmBrown }}>
          {t("admin.table.showing")} {resultCount} / {totalCount}
        </span>
      )}
    </div>
  );
}
