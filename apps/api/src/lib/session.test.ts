import { describe, expect, it } from "vitest";
import {
  clearSessionCookieHeader,
  parseSessionCookie,
  sessionCookieHeader,
} from "./session.js";

describe("parseSessionCookie", () => {
  it("extracts session id from cookie header", () => {
    expect(parseSessionCookie("session=abc-123")).toBe("abc-123");
  });

  it("extracts session from multiple cookies", () => {
    expect(parseSessionCookie("other=x; session=abc-123; foo=bar")).toBe("abc-123");
  });

  it("returns null for missing cookie header", () => {
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it("returns null when session cookie not present", () => {
    expect(parseSessionCookie("other=value")).toBeNull();
  });
});

describe("sessionCookieHeader", () => {
  it("returns secure session cookie without Max-Age by default", () => {
    const header = sessionCookieHeader("test-id");
    expect(header).toContain("session=test-id");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain("Path=/admin");
    expect(header).not.toContain("Max-Age");
  });

  it("includes Max-Age when persistent is true", () => {
    const header = sessionCookieHeader("test-id", true);
    expect(header).toContain("session=test-id");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Max-Age=2592000");
  });
});

describe("clearSessionCookieHeader", () => {
  it("returns cookie with Max-Age=0", () => {
    const header = clearSessionCookieHeader();
    expect(header).toContain("Max-Age=0");
    expect(header).toContain("HttpOnly");
  });
});
