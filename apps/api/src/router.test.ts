import { describe, expect, it } from "vitest";
import type { Kysely } from "kysely";
import type { Database } from "./db/types.js";
import { Router } from "./router.js";
import type { RequestContext } from "./router.js";
import { AppError } from "./lib/errors.js";

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    db: {} as Kysely<Database>,
    method: "GET",
    path: "/test",
    body: undefined,
    headers: {},
    params: {},
    ...overrides,
  };
}

describe("Router", () => {
  it("routes GET request to registered handler", async () => {
    const router = new Router();
    router.get("/test", async () => ({
      statusCode: 200,
      body: { ok: true },
    }));

    const response = await router.handle(makeCtx());
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("routes POST request", async () => {
    const router = new Router();
    router.post("/submit", async () => ({
      statusCode: 201,
      body: { created: true },
    }));

    const response = await router.handle(makeCtx({ method: "POST", path: "/submit" }));
    expect(response.statusCode).toBe(201);
  });

  it("routes PATCH request", async () => {
    const router = new Router();
    router.patch("/update", async () => ({
      statusCode: 200,
      body: { updated: true },
    }));

    const response = await router.handle(makeCtx({ method: "PATCH", path: "/update" }));
    expect(response.statusCode).toBe(200);
  });

  it("routes DELETE request", async () => {
    const router = new Router();
    router.delete("/remove", async () => ({
      statusCode: 204,
      body: null,
    }));

    const response = await router.handle(makeCtx({ method: "DELETE", path: "/remove" }));
    expect(response.statusCode).toBe(204);
  });

  it("returns 404 for unregistered path", async () => {
    const router = new Router();
    const response = await router.handle(makeCtx({ path: "/unknown" }));
    expect(response.statusCode).toBe(404);
  });

  it("returns 405 for wrong method on existing path", async () => {
    const router = new Router();
    router.get("/test", async () => ({ statusCode: 200, body: {} }));

    const response = await router.handle(makeCtx({ method: "POST", path: "/test" }));
    expect(response.statusCode).toBe(405);
  });

  it("handles AppError from handler", async () => {
    const router = new Router();
    router.get("/err", async () => {
      throw new AppError(409, "conflict", "DUPE");
    });

    const response = await router.handle(makeCtx({ path: "/err" }));
    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({ error: "conflict", code: "DUPE" });
  });

  it("handles unexpected errors as 500", async () => {
    const router = new Router();
    router.get("/crash", async () => {
      throw new Error("unexpected");
    });

    const response = await router.handle(makeCtx({ path: "/crash" }));
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });

  it("extracts path parameters from :param segments", async () => {
    const router = new Router();
    let captured: Record<string, string> = {};
    router.delete("/items/:id", async (ctx) => {
      captured = ctx.params;
      return { statusCode: 204, body: null };
    });

    const response = await router.handle(makeCtx({ method: "DELETE", path: "/items/abc-123" }));
    expect(response.statusCode).toBe(204);
    expect(captured).toEqual({ id: "abc-123" });
  });

  it("returns 404 when parameterized path has wrong segment count", async () => {
    const router = new Router();
    router.get("/items/:id", async () => ({ statusCode: 200, body: {} }));

    const response = await router.handle(makeCtx({ path: "/items/1/extra" }));
    expect(response.statusCode).toBe(404);
  });

  it("returns 405 for wrong method on parameterized path", async () => {
    const router = new Router();
    router.delete("/items/:id", async () => ({ statusCode: 204, body: null }));

    const response = await router.handle(makeCtx({ method: "GET", path: "/items/123" }));
    expect(response.statusCode).toBe(405);
  });
});
