import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const originalEnv = process.env["AWS_LAMBDA_FUNCTION_NAME"];

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = originalEnv;
    } else {
      delete process.env["AWS_LAMBDA_FUNCTION_NAME"];
    }
  });

  describe("Lambda mode (JSON output)", () => {
    it("writes JSON to stdout for info", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      logger.info("Server started");

      expect(writeSpy).toHaveBeenCalledOnce();
      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Server started");
      expect(parsed.timestamp).toBeDefined();

      writeSpy.mockRestore();
    });

    it("writes JSON to stderr for error", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

      logger.error("Something broke");

      expect(writeSpy).toHaveBeenCalledOnce();
      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.level).toBe("error");
      expect(parsed.message).toBe("Something broke");

      writeSpy.mockRestore();
    });

    it("serializes Error objects with name, message, and stack", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

      const err = new TypeError("bad input");
      logger.error("Failed", err);

      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.errorName).toBe("TypeError");
      expect(parsed.errorMessage).toBe("bad input");
      expect(parsed.stack).toContain("TypeError: bad input");

      writeSpy.mockRestore();
    });

    it("serializes plain object extra data", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      logger.info("Request handled", { path: "/public/status", statusCode: 200 });

      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.path).toBe("/public/status");
      expect(parsed.statusCode).toBe(200);

      writeSpy.mockRestore();
    });

    it("does not allow extra data to overwrite reserved fields", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      logger.info("Tricky", { level: "debug", message: "override", timestamp: "fake" });

      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Tricky");
      expect(parsed.timestamp).not.toBe("fake");

      writeSpy.mockRestore();
    });

    it("serializes non-Error thrown values", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

      logger.error("Failed", "string-error");

      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.detail).toBe("string-error");

      writeSpy.mockRestore();
    });

    it("writes JSON to stdout for warn", async () => {
      process.env["AWS_LAMBDA_FUNCTION_NAME"] = "test-fn";
      const { logger } = await import("./logger.js");

      const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      logger.warn("Deprecation notice");

      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.level).toBe("warn");
      expect(parsed.message).toBe("Deprecation notice");

      writeSpy.mockRestore();
    });
  });

  describe("Dev mode (text output)", () => {
    it("calls console.log for info", async () => {
      delete process.env["AWS_LAMBDA_FUNCTION_NAME"];
      const { logger } = await import("./logger.js");

      const spy = vi.spyOn(console, "log").mockImplementation(() => {});

      logger.info("Dev message");

      expect(spy).toHaveBeenCalledWith("[INFO]", "Dev message");

      spy.mockRestore();
    });

    it("calls console.error for error", async () => {
      delete process.env["AWS_LAMBDA_FUNCTION_NAME"];
      const { logger } = await import("./logger.js");

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const err = new Error("fail");
      logger.error("Oops", err);

      expect(spy).toHaveBeenCalledWith("[ERROR]", "Oops", err);

      spy.mockRestore();
    });

    it("calls console.warn for warn", async () => {
      delete process.env["AWS_LAMBDA_FUNCTION_NAME"];
      const { logger } = await import("./logger.js");

      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      logger.warn("Watch out");

      expect(spy).toHaveBeenCalledWith("[WARN]", "Watch out");

      spy.mockRestore();
    });
  });
});
