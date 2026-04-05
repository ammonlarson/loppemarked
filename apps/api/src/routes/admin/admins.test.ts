import { describe, expect, it, vi } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "../../db/types.js";
import type { RequestContext } from "../../router.js";
import { AppError } from "../../lib/errors.js";
import { handleCreateAdmin, handleDeleteAdmin, handleListAdmins } from "./admins.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "GET",
    path: "/admin/admins",
    body: undefined,
    headers: {},
    params: {},
    adminId: "admin-1",
    ...overrides,
  };
}

describe("handleListAdmins", () => {
  it("throws 401 when adminId is missing", async () => {
    try {
      await handleListAdmins(makeCtx({ adminId: undefined }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("returns admin list from database", async () => {
    const mockAdmins = [
      { id: "a1", email: "admin1@test.com", created_at: new Date("2026-01-01") },
      { id: "a2", email: "admin2@test.com", created_at: new Date("2026-01-02") },
    ];
    const executeFn = vi.fn().mockResolvedValue(mockAdmins);
    const orderByFn = vi.fn().mockReturnValue({ execute: executeFn });
    const selectFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    const result = await handleListAdmins(makeCtx({ db: mockDb }));

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(mockAdmins);
    expect(selectFromFn).toHaveBeenCalledWith("admins");
  });
});

describe("handleCreateAdmin", () => {
  it("throws 401 when adminId is missing", async () => {
    try {
      await handleCreateAdmin(makeCtx({ adminId: undefined }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("throws 400 when email is missing", async () => {
    try {
      await handleCreateAdmin(makeCtx({ body: { password: "test1234" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("Email and password are required");
    }
  });

  it("throws 400 when password is missing", async () => {
    try {
      await handleCreateAdmin(makeCtx({ body: { email: "new@test.com" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("Email and password are required");
    }
  });

  it("throws 400 when email format is invalid", async () => {
    try {
      await handleCreateAdmin(
        makeCtx({ body: { email: "not-an-email", password: "test1234" } }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 400 when password is too short", async () => {
    try {
      await handleCreateAdmin(
        makeCtx({ body: { email: "new@test.com", password: "short" } }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("Password must be at least 8 characters");
    }
  });

  it("throws 409 on duplicate email (unique violation)", async () => {
    const uniqueError = new Error("duplicate key") as Error & { code: string };
    uniqueError.code = "23505";
    const mockDb = {
      transaction: () => ({
        execute: () => Promise.reject(uniqueError),
      }),
    } as unknown as Kysely<Database>;

    try {
      await handleCreateAdmin(
        makeCtx({ db: mockDb, body: { email: "dup@test.com", password: "test1234" } }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("ADMIN_EXISTS");
    }
  });
});

describe("handleDeleteAdmin", () => {
  it("throws 401 when adminId is missing", async () => {
    try {
      await handleDeleteAdmin(makeCtx({ adminId: undefined, params: { id: "other" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("throws 400 when target id is missing", async () => {
    try {
      await handleDeleteAdmin(makeCtx({ params: {} }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 400 when attempting self-delete", async () => {
    try {
      await handleDeleteAdmin(makeCtx({ adminId: "admin-1", params: { id: "admin-1" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).code).toBe("SELF_DELETE");
      expect((err as AppError).message).toBe("Cannot delete your own account");
    }
  });

  it("throws 404 when target admin does not exist", async () => {
    const executeTakeFirstFn = vi.fn().mockResolvedValue(undefined);
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleDeleteAdmin(makeCtx({ db: mockDb, params: { id: "nonexistent" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
      expect((err as AppError).message).toBe("Admin not found");
    }
  });
});
