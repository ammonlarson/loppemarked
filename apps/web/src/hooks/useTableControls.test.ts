import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableControls } from "./useTableControls";

interface TestItem {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

const testData: TestItem[] = [
  { id: 1, name: "Alice", status: "active", created_at: "2026-01-01" },
  { id: 2, name: "Bob", status: "waiting", created_at: "2026-01-02" },
  { id: 3, name: "Charlie", status: "active", created_at: "2026-01-03" },
  { id: 4, name: "Diana", status: "cancelled", created_at: "2026-01-04" },
];

describe("useTableControls", () => {
  it("returns all data with no filters or sorting", () => {
    const { result } = renderHook(() =>
      useTableControls({ data: testData })
    );
    expect(result.current.processedData).toHaveLength(4);
    expect(result.current.hasActiveControls).toBe(false);
  });

  it("applies default sort", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        defaultSort: { key: "name", direction: "desc" },
      })
    );
    expect(result.current.processedData[0].name).toBe("Diana");
    expect(result.current.processedData[3].name).toBe("Alice");
  });

  it("toggles sort direction", () => {
    const { result } = renderHook(() =>
      useTableControls({ data: testData })
    );

    act(() => result.current.toggleSort("name"));
    expect(result.current.sort).toEqual({ key: "name", direction: "asc" });
    expect(result.current.processedData[0].name).toBe("Alice");

    act(() => result.current.toggleSort("name"));
    expect(result.current.sort).toEqual({ key: "name", direction: "desc" });
    expect(result.current.processedData[0].name).toBe("Diana");

    act(() => result.current.toggleSort("name"));
    expect(result.current.sort).toBeNull();
  });

  it("filters by search query", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        searchableFields: ["name"],
      })
    );

    act(() => result.current.setSearchQuery("ali"));
    expect(result.current.processedData).toHaveLength(1);
    expect(result.current.processedData[0].name).toBe("Alice");
    expect(result.current.hasActiveControls).toBe(true);
  });

  it("filters by dropdown filter", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        filterConfigs: [{ key: "status", allValue: "__all__" }],
      })
    );

    act(() => result.current.setFilter("status", "active"));
    expect(result.current.processedData).toHaveLength(2);
    expect(result.current.hasActiveControls).toBe(true);
  });

  it("clears all filters and sort", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        searchableFields: ["name"],
        filterConfigs: [{ key: "status", allValue: "__all__" }],
        defaultSort: { key: "id", direction: "asc" },
      })
    );

    act(() => {
      result.current.setSearchQuery("bob");
      result.current.setFilter("status", "waiting");
      result.current.toggleSort("name");
    });

    act(() => result.current.clearAll());
    expect(result.current.searchQuery).toBe("");
    expect(result.current.filters["status"]).toBe("__all__");
    expect(result.current.sort).toEqual({ key: "id", direction: "asc" });
    expect(result.current.processedData).toHaveLength(4);
  });

  it("sorts numeric fields correctly", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        defaultSort: { key: "id", direction: "desc" },
      })
    );
    expect(result.current.processedData[0].id).toBe(4);
    expect(result.current.processedData[3].id).toBe(1);
  });

  it("uses defaultValue for initial filter state", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        filterConfigs: [{ key: "status", allValue: "__all__", defaultValue: "active" }],
      })
    );

    expect(result.current.filters["status"]).toBe("active");
    expect(result.current.processedData).toHaveLength(2);
    expect(result.current.processedData.every((d) => d.status === "active")).toBe(true);
    expect(result.current.hasActiveControls).toBe(false);
  });

  it("clearAll resets to defaultValue not allValue", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        filterConfigs: [{ key: "status", allValue: "__all__", defaultValue: "active" }],
      })
    );

    act(() => result.current.setFilter("status", "waiting"));
    expect(result.current.hasActiveControls).toBe(true);

    act(() => result.current.clearAll());
    expect(result.current.filters["status"]).toBe("active");
    expect(result.current.processedData).toHaveLength(2);
  });

  it("combines search and filter", () => {
    const { result } = renderHook(() =>
      useTableControls({
        data: testData,
        searchableFields: ["name"],
        filterConfigs: [{ key: "status", allValue: "__all__" }],
      })
    );

    act(() => {
      result.current.setSearchQuery("a");
      result.current.setFilter("status", "active");
    });

    const names = result.current.processedData.map((d) => d.name);
    expect(names).toContain("Alice");
    expect(names).toContain("Charlie");
    expect(names).not.toContain("Diana");
  });
});
