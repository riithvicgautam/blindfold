import { createFileRoute } from "@tanstack/react-router";

import { authService } from "@/lib/auth/auth.service.server";
import { errorResponse, json, preflight } from "@/lib/auth/http.server";
import { readTokenFromRequest } from "@/lib/auth/jwt.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      GET: async ({ request }) => {
        try {
          const user = await authService.currentUser(readTokenFromRequest(request));
          return json(request, { user });
        } catch (error) {
          return errorResponse(request, error);
        }
      },
    },
  },
});
