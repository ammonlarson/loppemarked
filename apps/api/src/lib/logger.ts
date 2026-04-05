type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const RESERVED_KEYS = new Set(["level", "message", "timestamp"]);

const isLambda = !!process.env["AWS_LAMBDA_FUNCTION_NAME"];

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
    };
  }
  return { errorMessage: String(err) };
}

function serializeExtra(args: unknown[]): Record<string, unknown> {
  if (args.length === 0) return {};
  if (args.length === 1 && args[0] instanceof Error) {
    return formatError(args[0]);
  }
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
    return args[0] as Record<string, unknown>;
  }
  const extra: Record<string, unknown> = {};
  for (const arg of args) {
    if (arg instanceof Error) {
      Object.assign(extra, formatError(arg));
    } else if (typeof arg === "object" && arg !== null) {
      Object.assign(extra, arg);
    } else {
      extra["detail"] = arg;
    }
  }
  return extra;
}

function writeJson(level: LogLevel, message: string, args: unknown[]): void {
  const extra = serializeExtra(args);
  for (const key of RESERVED_KEYS) {
    delete extra[key];
  }
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  const output = JSON.stringify(entry);
  if (level === "error") {
    process.stderr.write(output + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

function writeText(level: LogLevel, message: string, args: unknown[]): void {
  const prefix = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "INFO";
  const consoleFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  consoleFn(`[${prefix}]`, message, ...args);
}

const write = isLambda ? writeJson : writeText;

export const logger = {
  info(message: string, ...args: unknown[]): void {
    write("info", message, args);
  },
  warn(message: string, ...args: unknown[]): void {
    write("warn", message, args);
  },
  error(message: string, ...args: unknown[]): void {
    write("error", message, args);
  },
};
