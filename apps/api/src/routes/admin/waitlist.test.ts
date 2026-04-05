import { describe, expect, it, vi } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "../../db/types.js";
import type { RequestContext } from "../../router.js";
import { AppError } from "../../lib/errors.js";
import { handleListWaitlist } from "./waitlist.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "GET",
    path: "/admin/waitlist",
    body: undefined,
    headers: {},
    params: {},
    adminId: "admin-1",
    ...overrides,
  };
}

describe("handleListWaitlist", () => {
  it("throws 401 when adminId is missing", async () => {
    try {
      await handleListWaitlist(makeCtx({ adminId: undefined }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("returns waitlist entries from database", async () => {
    const mockEntries = [
      { id: "w1", name: "Alice", email: "alice@example.com", status: "waiting" },
    ];
    const executeFn = vi.fn().mockResolvedValue(mockEntries);
    const orderByFn = vi.fn().mockReturnValue({ execute: executeFn });
    const selectFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    const result = await handleListWaitlist(makeCtx({ db: mockDb }));
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(mockEntries);
    expect(selectFromFn).toHaveBeenCalledWith("waitlist_entries");
  });

  it("returns empty array when no waitlist entries exist", async () => {
    const executeFn = vi.fn().mockResolvedValue([]);
    const orderByFn = vi.fn().mockReturnValue({ execute: executeFn });
    const selectFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    const result = await handleListWaitlist(makeCtx({ db: mockDb }));
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual([]);
  });
});
