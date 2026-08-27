export class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

export const invalidInput = (details: Record<string, string[]>) =>
  new AuthError(400, "invalid_input", "Please check the highlighted fields.", details);

export const conflict = (message: string) => new AuthError(409, "conflict", message);

export const invalidCredentials = () =>
  new AuthError(401, "invalid_credentials", "That email or password is not right.");

export const unauthorized = (message = "You need to sign in to continue.") =>
  new AuthError(401, "unauthorized", message);
