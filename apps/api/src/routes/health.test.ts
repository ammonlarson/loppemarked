import { describe, expect, it } from "vitest";
import { handleHealth } from "./health.js";

describe("handleHealth", () => {
  it("returns 200 with ok status", async () => {
    const response = await handleHealth();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
