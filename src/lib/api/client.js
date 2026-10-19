/**
 * Centralized API client. Every request to the Express backend goes through
 * here: one base URL, cookies always sent, one error shape.
 */

export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {{ code: string, message: string, details?: Record<string, string[]> }} payload
   */
  constructor(status, payload) {
    super(payload.message);
    this.name = "ApiError";
    /** @type {number} */
    this.status = status;
    /** @type {string} */
    this.code = payload.code;
    /** @type {Record<string, string[]> | undefined} */
    this.details = payload.details;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include", // the JWT lives in an httpOnly cookie
    signal: signal ?? null,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? { code: "server_error", message: "Something went wrong. Please try again." },
    );
  }
  return payload;
}

export const apiClient = {
  /** @param {string} path @param {{ signal?: AbortSignal }} [o] */
  get: (path, o = {}) => request(path, { ...o, method: "GET" }),
  /** @param {string} path @param {unknown} [body] */
  post: (path, body) => request(path, { method: "POST", body }),
  /** @param {string} path @param {unknown} [body] */
  patch: (path, body) => request(path, { method: "PATCH", body }),
  /** @param {string} path @param {{ body?: unknown }} [o] */
  delete: (path, o = {}) => request(path, { method: "DELETE", body: o.body }),
};
