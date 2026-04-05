import type { Kysely } from "kysely";
import type { Database } from "../db/types.js";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const PERSISTENT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(
  db: Kysely<Database>,
  adminId: string,
  persistent = false,
): Promise<string> {
  const ttl = persistent ? PERSISTENT_SESSION_TTL_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const result = await db
    .insertInto("sessions")
    .values({ admin_id: adminId, expires_at: expiresAt })
    .returning("id")
    .executeTakeFirstOrThrow();
  return result.id;
}

export async function validateSession(
  db: Kysely<Database>,
  sessionId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom("sessions")
    .innerJoin("admins", "admins.id", "sessions.admin_id")
    .select(["sessions.admin_id", "sessions.expires_at"])
    .where("sessions.id", "=", sessionId)
    .executeTakeFirst();

  if (!row) return null;

  const expires = new Date(row.expires_at);
  if (expires.getTime() <= Date.now()) {
    await db.deleteFrom("sessions").where("id", "=", sessionId).execute();
    return null;
  }

  return row.admin_id;
}

export async function deleteSession(
  db: Kysely<Database>,
  sessionId: string,
): Promise<void> {
  await db.deleteFrom("sessions").where("id", "=", sessionId).execute();
}

export async function deleteExpiredSessions(
  db: Kysely<Database>,
): Promise<number> {
  const result = await db
    .deleteFrom("sessions")
    .where("expires_at", "<=", new Date())
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}

export function parseSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}

export function sessionCookieHeader(sessionId: string, persistent = false): string {
  const base = `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/admin`;
  if (persistent) {
    const maxAgeSeconds = Math.floor(PERSISTENT_SESSION_TTL_MS / 1000);
    return `${base}; Max-Age=${maxAgeSeconds}`;
  }
  return base;
}

export function clearSessionCookieHeader(): string {
  return "session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0";
}
