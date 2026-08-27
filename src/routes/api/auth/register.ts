import { createFileRoute } from "@tanstack/react-router";

import { authService } from "@/lib/auth/auth.service.server";
import { invalidInput } from "@/lib/auth/errors";
import { errorResponse, fieldErrors, json, preflight } from "@/lib/auth/http.server";
import { buildSessionCookie } from "@/lib/auth/jwt.server";
import { registerSchema } from "@/lib/auth/validation";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const parsed = registerSchema.safeParse(body);
          if (!parsed.success) throw invalidInput(fieldErrors(parsed.error.issues));

          const { user, token } = await authService.register(parsed.data);
          return json(
            request,
            { user, token },
            { status: 201, headers: { "set-cookie": buildSessionCookie(token) } },
          );
        } catch (error) {
          return errorResponse(request, error);
        }
      },
    },
  },
});
