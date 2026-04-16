import { describe, expect, it, vi } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "../../db/types.js";
import type { RequestContext } from "../../router.js";
import { AppError } from "../../lib/errors.js";
import { OPENING_TIMEZONE } from "@loppemarked/shared";
import {
  handleGetOpeningTime,
  handleUpdateOpeningTime,
} from "./settings.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "GET",
    path: "/admin/settings/opening-time",
    body: undefined,
    headers: {},
    params: {},
    adminId: "admin-1",
    ...overrides,
  };
}

describe("handleGetOpeningTime", () => {
  it("returns opening datetime and timezone from database", async () => {
    const storedDate = "2026-04-01T10:00:00.000Z";
    const updatedAt = "2026-03-15T12:00:00.000Z";
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      opening_datetime: storedDate,
      updated_at: updatedAt,
    });
    const selectFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    const res = await handleGetOpeningTime(makeCtx({ db: mockDb }));
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.openingDatetime).toBe(new Date(storedDate).toISOString());
    expect(body.timezone).toBe(OPENING_TIMEZONE);
    expect(body.updatedAt).toBe(new Date(updatedAt).toISOString());
  });

  it("returns null values when no settings exist", async () => {
    const executeTakeFirstFn = vi.fn().mockResolvedValue(undefined);
    const selectFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    const res = await handleGetOpeningTime(makeCtx({ db: mockDb }));
    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.openingDatetime).toBeNull();
    expect(body.timezone).toBe(OPENING_TIMEZONE);
    expect(body.updatedAt).toBeNull();
  });

});

describe("handleUpdateOpeningTime", () => {
  it("throws 400 when openingDatetime is missing", async () => {
    try {
      await handleUpdateOpeningTime(makeCtx({ body: {} }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("openingDatetime is required");
    }
  });

  it("throws 400 when openingDatetime is invalid", async () => {
    try {
      await handleUpdateOpeningTime(
        makeCtx({ body: { openingDatetime: "not-a-date" } }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe(
        "openingDatetime must be a valid ISO 8601 datetime",
      );
    }
  });

  it("throws 400 when system settings not initialized", async () => {
    const executeTakeFirstFn = vi.fn().mockResolvedValue(undefined);
    const selectFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleUpdateOpeningTime(
        makeCtx({
          db: mockDb,
          body: { openingDatetime: "2026-04-15T10:00:00Z" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("System settings not initialized");
    }
  });

  it("updates opening time and logs audit event", async () => {
    const currentDate = "2026-04-01T10:00:00.000Z";
    const newDate = "2026-04-15T10:00:00Z";

    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      id: "settings-1",
      opening_datetime: currentDate,
    });
    const selectFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });

    const updateExecuteFn = vi.fn().mockResolvedValue(undefined);
    const updateWhereFn = vi.fn().mockReturnValue({ execute: updateExecuteFn });
    const setFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    const updateTableFn = vi.fn().mockReturnValue({ set: setFn });

    const auditExecuteFn = vi.fn().mockResolvedValue(undefined);
    const auditValuesFn = vi.fn().mockReturnValue({ execute: auditExecuteFn });
    const insertIntoFn = vi.fn().mockReturnValue({ values: auditValuesFn });

    const trx = {
      updateTable: updateTableFn,
      insertInto: insertIntoFn,
    };

    const mockDb = {
      selectFrom: selectFromFn,
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn().mockImplementation(
          async (fn: (t: unknown) => Promise<unknown>) => fn(trx),
        ),
      }),
    } as unknown as Kysely<Database>;

    const res = await handleUpdateOpeningTime(
      makeCtx({
        db: mockDb,
        adminId: "admin-1",
        body: { openingDatetime: newDate },
      }),
    );

    expect(res.statusCode).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.openingDatetime).toBe(new Date(newDate).toISOString());
    expect(body.timezone).toBe(OPENING_TIMEZONE);
    expect(body.updatedAt).toBeTruthy();
  });

  it("records before and after datetime in audit event", async () => {
    const currentDate = "2026-04-01T10:00:00.000Z";
    const newDate = "2026-05-01T10:00:00Z";

    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      id: "settings-1",
      opening_datetime: currentDate,
    });
    const selectFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });

    const updateExecuteFn = vi.fn().mockResolvedValue(undefined);
    const updateWhereFn = vi.fn().mockReturnValue({ execute: updateExecuteFn });
    const setFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    const updateTableFn = vi.fn().mockReturnValue({ set: setFn });

    const auditExecuteFn = vi.fn().mockResolvedValue(undefined);
    const auditValuesFn = vi.fn().mockReturnValue({ execute: auditExecuteFn });
    const insertIntoFn = vi.fn().mockReturnValue({ values: auditValuesFn });

    const trx = {
      updateTable: updateTableFn,
      insertInto: insertIntoFn,
    };

    const mockDb = {
      selectFrom: selectFromFn,
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn().mockImplementation(
          async (fn: (t: unknown) => Promise<unknown>) => fn(trx),
        ),
      }),
    } as unknown as Kysely<Database>;

    await handleUpdateOpeningTime(
      makeCtx({
        db: mockDb,
        adminId: "admin-1",
        body: { openingDatetime: newDate },
      }),
    );

    expect(insertIntoFn).toHaveBeenCalledWith("audit_events");
    const auditValues = auditValuesFn.mock.calls[0][0];
    expect(auditValues.action).toBe("opening_datetime_change");
    expect(auditValues.actor_type).toBe("admin");
    expect(auditValues.actor_id).toBe("admin-1");
    expect(auditValues.entity_type).toBe("system_settings");
    const before = JSON.parse(auditValues.before);
    const after = JSON.parse(auditValues.after);
    expect(before.opening_datetime).toBe(new Date(currentDate).toISOString());
    expect(after.opening_datetime).toBe(new Date(newDate).toISOString());
  });
});
