import { AuthError } from "./errors";

/**
 * CORS for the frontend. The app is served from the same origin, so this only
 * matters for extra origins listed in AUTH_ALLOWED_ORIGINS (comma separated).
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const allowed = (process.env["AUTH_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const isSameOrigin = origin === url.origin;
  if (!origin || (!isSameOrigin && !allowed.includes(origin))) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function json(
  request: Request,
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(request),
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof AuthError) {
    return json(
      request,
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  console.error("[auth]", error);
  return json(
    request,
    { error: { code: "server_error", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

export function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const details: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    (details[key] ??= []).push(issue.message);
  }
  return details;
}
