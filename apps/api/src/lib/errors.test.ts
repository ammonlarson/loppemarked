import { describe, expect, it } from "vitest";
import {
  AppError,
  badRequest,
  conflict,
  methodNotAllowed,
  notFound,
  toErrorBody,
  unauthorized,
} from "./errors.js";

describe("AppError", () => {
  it("creates error with status code and message", () => {
    const err = new AppError(400, "bad input", "BAD_INPUT");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad input");
    expect(err.code).toBe("BAD_INPUT");
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("error factories", () => {
  it("badRequest returns 400", () => {
    const err = badRequest("missing field");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("missing field");
  });

  it("unauthorized returns 401", () => {
    const err = unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("notFound returns 404", () => {
    const err = notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("conflict returns 409", () => {
    const err = conflict("already exists", "DUPLICATE");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("DUPLICATE");
  });

  it("methodNotAllowed returns 405", () => {
    const err = methodNotAllowed();
    expect(err.statusCode).toBe(405);
  });
});

describe("toErrorBody", () => {
  it("returns error body with code", () => {
    const body = toErrorBody(new AppError(400, "oops", "BAD"));
    expect(body).toEqual({ error: "oops", code: "BAD" });
  });

  it("omits code when not set", () => {
    const body = toErrorBody(new AppError(500, "fail"));
    expect(body).toEqual({ error: "fail" });
  });
});
