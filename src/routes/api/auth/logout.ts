import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, json, preflight } from "@/lib/auth/http.server";
import { buildClearedSessionCookie } from "@/lib/auth/jwt.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request }) => {
        try {
          return json(
            request,
            { ok: true },
            { headers: { "set-cookie": buildClearedSessionCookie() } },
          );
        } catch (error) {
          return errorResponse(request, error);
        }
      },
    },
  },
});
