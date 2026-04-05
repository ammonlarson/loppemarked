"use client";

import type { CSSProperties } from "react";
import type { SortConfig } from "@/hooks/useTableControls";
import { colors, fonts } from "@/styles/theme";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortConfig | null;
  onToggle: (key: string) => void;
  style?: CSSProperties;
}

export function SortableHeader({ label, sortKey, sort, onToggle, style }: SortableHeaderProps) {
  const isActive = sort?.key === sortKey;
  const arrow = isActive ? (sort.direction === "asc" ? " \u25B2" : " \u25BC") : "";
  const ariaSort = isActive
    ? sort.direction === "asc" ? "ascending" as const : "descending" as const
    : "none" as const;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(sortKey);
    }
  }

  return (
    <th
      onClick={() => onToggle(sortKey)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-sort={ariaSort}
      role="columnheader"
      style={{
        padding: "0.5rem",
        borderBottom: `2px solid ${colors.borderTan}`,
        textAlign: "left",
        cursor: "pointer",
        userSelect: "none",
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: "0.85rem",
        color: isActive ? colors.sageDark : colors.warmBrown,
        ...style,
      }}
    >
      {label}{arrow}
    </th>
  );
}
