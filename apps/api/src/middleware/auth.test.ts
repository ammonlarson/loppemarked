import { describe, expect, it } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "../db/types.js";
import { requireAdmin } from "./auth.js";
import type { RequestContext } from "../router.js";
import { AppError } from "../lib/errors.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "GET",
    path: "/admin/test",
    body: undefined,
    headers: {},
    params: {},
    ...overrides,
  };
}

describe("requireAdmin middleware", () => {
  it("throws 401 when no cookie header", async () => {
    const handler = requireAdmin(async () => ({
      statusCode: 200,
      body: {},
    }));

    try {
      await handler(makeCtx());
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("throws 401 when session cookie is missing from header", async () => {
    const handler = requireAdmin(async () => ({
      statusCode: 200,
      body: {},
    }));

    try {
      await handler(makeCtx({ headers: { cookie: "other=value" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });
});
