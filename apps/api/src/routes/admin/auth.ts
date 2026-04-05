import { logAuditEvent } from "../../lib/audit.js";
import { badRequest, unauthorized } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  clearSessionCookieHeader,
  createSession,
  deleteSession,
  parseSessionCookie,
  sessionCookieHeader,
} from "../../lib/session.js";
import type { RequestContext, RouteResponse } from "../../router.js";

interface LoginBody {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

export async function handleLogin(ctx: RequestContext): Promise<RouteResponse> {
  const { email, password, rememberMe } = (ctx.body ?? {}) as LoginBody;

  if (!email || !password) {
    throw badRequest("Email and password are required");
  }

  const admin = await ctx.db
    .selectFrom("admins")
    .innerJoin("admin_credentials", "admin_credentials.admin_id", "admins.id")
    .select(["admins.id", "admin_credentials.password_hash"])
    .where("admins.email", "=", email)
    .executeTakeFirst();

  if (!admin) {
    await verifyPassword(password, "0".repeat(64) + ":" + "0".repeat(128));
    throw unauthorized("Invalid credentials");
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    throw unauthorized("Invalid credentials");
  }

  const persistent = rememberMe === true;
  const sessionId = await createSession(ctx.db, admin.id, persistent);

  return {
    statusCode: 200,
    body: { message: "Authenticated" },
    headers: {
      "Set-Cookie": sessionCookieHeader(sessionId, persistent),
    },
  };
}

export async function handleMe(ctx: RequestContext): Promise<RouteResponse> {
  void ctx;
  return {
    statusCode: 200,
    body: { authenticated: true },
  };
}

export async function handleLogout(ctx: RequestContext): Promise<RouteResponse> {
  const sessionId = parseSessionCookie(ctx.headers["cookie"]);
  if (sessionId) {
    await deleteSession(ctx.db, sessionId);
  }

  return {
    statusCode: 200,
    body: { message: "Logged out" },
    headers: {
      "Set-Cookie": clearSessionCookieHeader(),
    },
  };
}

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

export async function handleChangePassword(ctx: RequestContext): Promise<RouteResponse> {
  const adminId = ctx.adminId;
  if (!adminId) {
    throw unauthorized();
  }

  const { currentPassword, newPassword } = (ctx.body ?? {}) as ChangePasswordBody;

  if (!currentPassword || !newPassword) {
    throw badRequest("Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw badRequest("New password must be at least 8 characters");
  }

  const credential = await ctx.db
    .selectFrom("admin_credentials")
    .select("password_hash")
    .where("admin_id", "=", adminId)
    .executeTakeFirst();

  if (!credential) {
    throw unauthorized("Invalid credentials");
  }

  const valid = await verifyPassword(currentPassword, credential.password_hash);
  if (!valid) {
    throw unauthorized("Current password is incorrect");
  }

  const newHash = await hashPassword(newPassword);
  await ctx.db.transaction().execute(async (trx) => {
    await trx
      .updateTable("admin_credentials")
      .set({ password_hash: newHash, updated_at: new Date().toISOString() })
      .where("admin_id", "=", adminId)
      .execute();

    await logAuditEvent(trx, {
      actor_type: "admin",
      actor_id: adminId,
      action: "admin_password_change",
      entity_type: "admin",
      entity_id: adminId,
    });
  });

  return {
    statusCode: 200,
    body: { message: "Password updated" },
  };
}
