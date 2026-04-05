import { describe, expect, it, vi } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "../../db/types.js";
import type { RequestContext } from "../../router.js";
import { AppError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/password.js";
import {
  handleChangePassword,
  handleLogin,
  handleLogout,
  handleMe,
} from "./auth.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "POST",
    path: "/admin/login",
    body: undefined,
    headers: {},
    params: {},
    ...overrides,
  };
}

describe("handleLogin", () => {
  it("throws 400 when email is missing", async () => {
    try {
      await handleLogin(makeCtx({ body: { password: "test1234" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe("Email and password are required");
    }
  });

  it("throws 400 when password is missing", async () => {
    try {
      await handleLogin(makeCtx({ body: { email: "admin@test.com" } }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 400 when body is empty", async () => {
    try {
      await handleLogin(makeCtx({ body: {} }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 401 when admin not found", async () => {
    const executeTakeFirstFn = vi.fn().mockResolvedValue(undefined);
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const innerJoinFn = vi.fn().mockReturnValue({ select: selectFn });
    const selectFromFn = vi.fn().mockReturnValue({ innerJoin: innerJoinFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleLogin(
        makeCtx({
          db: mockDb,
          body: { email: "nonexistent@test.com", password: "test1234" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).message).toBe("Invalid credentials");
    }
  });

  it("throws 401 when password is wrong", async () => {
    const storedHash = await hashPassword("correctpassword");
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      id: "admin-1",
      password_hash: storedHash,
    });
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const innerJoinFn = vi.fn().mockReturnValue({ select: selectFn });
    const selectFromFn = vi.fn().mockReturnValue({ innerJoin: innerJoinFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleLogin(
        makeCtx({
          db: mockDb,
          body: { email: "admin@test.com", password: "wrongpassword" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).message).toBe("Invalid credentials");
    }
  });

  it("returns 200 with session cookie on valid login", async () => {
    const storedHash = await hashPassword("test1234");
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      id: "admin-1",
      password_hash: storedHash,
    });
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const innerJoinFn = vi.fn().mockReturnValue({ select: selectFn });
    const selectFromFn = vi.fn().mockReturnValue({ innerJoin: innerJoinFn });
    const sessionInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: "session-123" }),
        }),
      }),
    });
    const mockDb = {
      selectFrom: selectFromFn,
      insertInto: sessionInsert,
    } as unknown as Kysely<Database>;

    const res = await handleLogin(
      makeCtx({
        db: mockDb,
        body: { email: "admin@test.com", password: "test1234" },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Authenticated" });
    expect(res.headers?.["Set-Cookie"]).toContain("session=session-123");
    expect(res.headers?.["Set-Cookie"]).toContain("HttpOnly");
    expect(res.headers?.["Set-Cookie"]).toContain("Secure");
    expect(res.headers?.["Set-Cookie"]).toContain("Path=/admin");
    expect(sessionInsert).toHaveBeenCalledWith("sessions");
    expect(res.headers?.["Set-Cookie"]).not.toContain("Max-Age");
  });

  it("returns persistent cookie when rememberMe is true", async () => {
    const storedHash = await hashPassword("test1234");
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      id: "admin-1",
      password_hash: storedHash,
    });
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const innerJoinFn = vi.fn().mockReturnValue({ select: selectFn });
    const selectFromFn = vi.fn().mockReturnValue({ innerJoin: innerJoinFn });
    const sessionInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: "session-456" }),
        }),
      }),
    });
    const mockDb = {
      selectFrom: selectFromFn,
      insertInto: sessionInsert,
    } as unknown as Kysely<Database>;

    const res = await handleLogin(
      makeCtx({
        db: mockDb,
        body: { email: "admin@test.com", password: "test1234", rememberMe: true },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers?.["Set-Cookie"]).toContain("session=session-456");
    expect(res.headers?.["Set-Cookie"]).toContain("Max-Age=2592000");
  });
});

describe("handleMe", () => {
  it("returns 200 with authenticated status", async () => {
    const res = await handleMe(makeCtx({ adminId: "admin-1" }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ authenticated: true });
  });
});

describe("handleLogout", () => {
  it("clears session cookie even without existing session", async () => {
    const res = await handleLogout(makeCtx({ headers: {} }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Logged out" });
    expect(res.headers?.["Set-Cookie"]).toContain("Max-Age=0");
  });

  it("deletes session and clears cookie when session cookie exists", async () => {
    const executeFn = vi.fn().mockResolvedValue(undefined);
    const whereFn = vi.fn().mockReturnValue({ execute: executeFn });
    const deleteFromFn = vi.fn().mockReturnValue({ where: whereFn });
    const mockDb = { deleteFrom: deleteFromFn } as unknown as Kysely<Database>;

    const res = await handleLogout(
      makeCtx({
        db: mockDb,
        headers: { cookie: "session=sess-abc123" },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Logged out" });
    expect(res.headers?.["Set-Cookie"]).toContain("Max-Age=0");
    expect(deleteFromFn).toHaveBeenCalledWith("sessions");
    expect(whereFn).toHaveBeenCalledWith("id", "=", "sess-abc123");
  });
});

describe("handleChangePassword", () => {
  it("throws 401 when adminId is missing", async () => {
    try {
      await handleChangePassword(makeCtx({ adminId: undefined }));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("throws 400 when currentPassword is missing", async () => {
    try {
      await handleChangePassword(
        makeCtx({
          adminId: "admin-1",
          body: { newPassword: "newpassword123" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe(
        "Current password and new password are required",
      );
    }
  });

  it("throws 400 when newPassword is missing", async () => {
    try {
      await handleChangePassword(
        makeCtx({
          adminId: "admin-1",
          body: { currentPassword: "current1234" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 400 when new password is too short", async () => {
    try {
      await handleChangePassword(
        makeCtx({
          adminId: "admin-1",
          body: { currentPassword: "current1234", newPassword: "short" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe(
        "New password must be at least 8 characters",
      );
    }
  });

  it("throws 401 when credential not found", async () => {
    const executeTakeFirstFn = vi.fn().mockResolvedValue(undefined);
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleChangePassword(
        makeCtx({
          db: mockDb,
          adminId: "admin-1",
          body: { currentPassword: "current1234", newPassword: "newpassword123" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).message).toBe("Invalid credentials");
    }
  });

  it("throws 401 when current password is incorrect", async () => {
    const storedHash = await hashPassword("actualpassword");
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      password_hash: storedHash,
    });
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFromFn = vi.fn().mockReturnValue({ select: selectFn });
    const mockDb = { selectFrom: selectFromFn } as unknown as Kysely<Database>;

    try {
      await handleChangePassword(
        makeCtx({
          db: mockDb,
          adminId: "admin-1",
          body: { currentPassword: "wrongpassword", newPassword: "newpassword123" },
        }),
      );
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).message).toBe("Current password is incorrect");
    }
  });

  it("returns 200 and updates password when current password is correct", async () => {
    const storedHash = await hashPassword("current1234");
    const executeTakeFirstFn = vi.fn().mockResolvedValue({
      password_hash: storedHash,
    });
    const whereFn = vi.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstFn });
    const selectFn = vi.fn().mockReturnValue({ where: whereFn });
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

    const res = await handleChangePassword(
      makeCtx({
        db: mockDb,
        adminId: "admin-1",
        body: { currentPassword: "current1234", newPassword: "newpassword123" },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Password updated" });
    expect(updateTableFn).toHaveBeenCalledWith("admin_credentials");
    expect(setFn).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
    );
    expect(insertIntoFn).toHaveBeenCalledWith("audit_events");
  });
});
