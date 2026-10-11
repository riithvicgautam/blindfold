/** An error that is safe to show to the user. */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, "bad_request", message, details);
export const invalidInput = (details) =>
  new HttpError(400, "invalid_input", "Please check the highlighted fields.", details);
export const unauthorized = (message = "You need to sign in to continue.") =>
  new HttpError(401, "unauthorized", message);
export const conflict = (message) => new HttpError(409, "conflict", message);

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: "not_found", message: `No route for ${req.method} ${req.path}` } });
}

/** Every error ends up here. Unknown errors become a generic 500 — no internals leak. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "bad_request", message: "Invalid JSON body." } });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "too_large", message: "That request is too large." } });
  }
  // Postgres unreachable / pool errors
  if (err.code === "ECONNREFUSED" || err.code === "57P01" || err.code === "3D000") {
    console.error("Database unavailable:", err.message);
    return res.status(503).json({ error: { code: "db_unavailable", message: "The database is unavailable. Please try again shortly." } });
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ error: { code: "server_error", message: "Something went wrong. Please try again." } });
}
