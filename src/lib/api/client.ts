/**
 * Centralized API client.
 *
 * Every request the frontend makes to the Fastify backend goes through here:
 * one base URL, one credentials policy, one error shape.
 */

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    if (payload.details) this.details = payload.details;
  }
}

/** Base URL of the Fastify server, e.g. http://localhost:4000/api */
export const API_BASE_URL = (
  import.meta.env["VITE_API_URL"] ?? "http://localhost:4000/api"
).replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, headers } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    // Session persistence relies on the backend's httpOnly cookie.
    credentials: "include",
    signal: signal ?? null,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as { error?: ApiErrorPayload } | null)?.error;
    throw new ApiError(
      response.status,
      error ?? { code: "server_error", message: "Something went wrong. Please try again." },
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
