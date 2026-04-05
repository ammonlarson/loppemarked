import { describe, expect, it, vi } from "vitest";
import { logAuditEvent } from "./audit.js";

function makeMockDb() {
  const executeFn = vi.fn().mockResolvedValue(undefined);
  const valuesFn = vi.fn().mockReturnValue({ execute: executeFn });
  const insertIntoFn = vi.fn().mockReturnValue({ values: valuesFn });
  return {
    db: { insertInto: insertIntoFn } as never,
    insertIntoFn,
    valuesFn,
    executeFn,
  };
}

describe("logAuditEvent", () => {
  it("inserts audit event with all fields", async () => {
    const { db, insertIntoFn, valuesFn } = makeMockDb();

    await logAuditEvent(db, {
      actor_type: "admin",
      actor_id: "admin-1",
      action: "admin_create",
      entity_type: "admin",
      entity_id: "admin-2",
      before: { email: "old@test.com" },
      after: { email: "new@test.com" },
      reason: "test reason",
    });

    expect(insertIntoFn).toHaveBeenCalledWith("audit_events");
    expect(valuesFn).toHaveBeenCalledWith({
      actor_type: "admin",
      actor_id: "admin-1",
      action: "admin_create",
      entity_type: "admin",
      entity_id: "admin-2",
      before: JSON.stringify({ email: "old@test.com" }),
      after: JSON.stringify({ email: "new@test.com" }),
      reason: "test reason",
    });
  });

  it("serializes before/after as JSON strings", async () => {
    const { db, valuesFn } = makeMockDb();

    await logAuditEvent(db, {
      actor_type: "admin",
      actor_id: "admin-1",
      action: "admin_delete",
      entity_type: "admin",
      entity_id: "admin-2",
      before: { email: "user@test.com" },
    });

    const values = valuesFn.mock.calls[0][0];
    expect(values.before).toBe('{"email":"user@test.com"}');
    expect(values.after).toBeNull();
  });

  it("sets before/after to null when not provided", async () => {
    const { db, valuesFn } = makeMockDb();

    await logAuditEvent(db, {
      actor_type: "system",
      actor_id: null,
      action: "admin_password_change",
      entity_type: "admin",
      entity_id: "admin-1",
    });

    const values = valuesFn.mock.calls[0][0];
    expect(values.before).toBeNull();
    expect(values.after).toBeNull();
    expect(values.reason).toBeNull();
  });

  it("sets reason to null when not provided", async () => {
    const { db, valuesFn } = makeMockDb();

    await logAuditEvent(db, {
      actor_type: "admin",
      actor_id: "admin-1",
      action: "admin_create",
      entity_type: "admin",
      entity_id: "admin-2",
    });

    const values = valuesFn.mock.calls[0][0];
    expect(values.reason).toBeNull();
  });
});
