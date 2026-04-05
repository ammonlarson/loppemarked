import { describe, expect, it } from "vitest";
import { up, down } from "./migrations/001_initial_schema.js";

describe("initial schema migration", () => {
  it("exports up function", () => {
    expect(typeof up).toBe("function");
  });

  it("exports down function", () => {
    expect(typeof down).toBe("function");
  });
});

describe("migration structure", () => {
  it("up and down are async functions", () => {
    expect(up.constructor.name).toBe("AsyncFunction");
    expect(down.constructor.name).toBe("AsyncFunction");
  });
});
