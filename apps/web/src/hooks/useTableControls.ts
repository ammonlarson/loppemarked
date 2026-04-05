"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfigEntry<T> {
  key: keyof T;
  allValue: string;
  defaultValue?: string;
}

export interface TableControlsOptions<T> {
  data: T[];
  defaultSort?: SortConfig;
  searchableFields?: (keyof T)[];
  filterConfigs?: FilterConfigEntry<T>[];
}

function useStableArray<T>(arr: T[]): T[] {
  const ref = useRef(arr);
  const serialized = JSON.stringify(arr);
  const prevSerialized = useRef(serialized);
  if (serialized !== prevSerialized.current) {
    ref.current = arr;
    prevSerialized.current = serialized;
  }
  return ref.current;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableControls<T extends Record<string, any>>({
  data,
  defaultSort,
  searchableFields = [],
  filterConfigs = [],
}: TableControlsOptions<T>) {
  const stableSearchableFields = useStableArray(searchableFields as string[]);
  const stableFilterConfigs = useStableArray(filterConfigs as FilterConfigEntry<T>[]);

  const [sort, setSort] = useState<SortConfig | null>(defaultSort ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const fc of stableFilterConfigs) {
      initial[fc.key as string] = fc.defaultValue ?? fc.allValue;
    }
    return initial;
  });

  const defaultSortRef = useRef(defaultSort);
  defaultSortRef.current = defaultSort;

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" as const }
          : null;
      }
      return { key, direction: "asc" as const };
    });
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setSort(defaultSortRef.current ?? null);
    const initial: Record<string, string> = {};
    for (const fc of stableFilterConfigs) {
      initial[fc.key as string] = fc.defaultValue ?? fc.allValue;
    }
    setFilters(initial);
  }, [stableFilterConfigs]);

  const hasActiveControls = useMemo(() => {
    if (searchQuery.trim()) return true;
    for (const fc of stableFilterConfigs) {
      const resetValue = fc.defaultValue ?? fc.allValue;
      if (filters[fc.key as string] !== resetValue) return true;
    }
    return false;
  }, [searchQuery, filters, stableFilterConfigs]);

  const processedData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) =>
        stableSearchableFields.some((field) => {
          const val = item[field as keyof T];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    for (const fc of stableFilterConfigs) {
      const filterValue = filters[fc.key as string];
      if (filterValue && filterValue !== fc.allValue) {
        result = result.filter((item) => String(item[fc.key]) === filterValue);
      }
    }

    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.key as keyof T];
        const bVal = b[sort.key as keyof T];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let cmp: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }

        return sort.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchQuery, stableSearchableFields, filters, stableFilterConfigs, sort]);

  return {
    sort,
    toggleSort,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearAll,
    hasActiveControls,
    processedData,
  };
}
