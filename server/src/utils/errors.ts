/**
 * Application-level errors. Anything thrown that is not an AppError is treated
 * as an unexpected failure and reported as a generic 500 by the error handler.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    if (details) this.details = details;
  }
}

export const badRequest = (message: string, details?: Record<string, string[]>) =>
  new AppError(400, "bad_request", message, details);

export const validationFailed = (details: Record<string, string[]>) =>
  new AppError(400, "invalid_input", "Please check the highlighted fields.", details);

export const unauthorized = (message = "You need to sign in to continue.") =>
  new AppError(401, "unauthorized", message);

export const invalidCredentials = () =>
  new AppError(401, "invalid_credentials", "That email or password is not right.");

export const forbidden = (message = "You do not have access to this resource.") =>
  new AppError(403, "forbidden", message);

export const notFound = (message = "Resource not found.") =>
  new AppError(404, "not_found", message);

export const conflict = (message: string) => new AppError(409, "conflict", message);
