export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, code?: string): AppError {
  return new AppError(400, message, code);
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function notFound(message = "Not found"): AppError {
  return new AppError(404, message, "NOT_FOUND");
}

export function conflict(message: string, code?: string): AppError {
  return new AppError(409, message, code);
}

export function methodNotAllowed(): AppError {
  return new AppError(405, "Method not allowed", "METHOD_NOT_ALLOWED");
}

export interface ErrorBody {
  error: string;
  code?: string;
}

export function toErrorBody(err: AppError): ErrorBody {
  const body: ErrorBody = { error: err.message };
  if (err.code) {
    body.code = err.code;
  }
  return body;
}
