import { apiClient } from "./client";
import type { PublicUser } from "@/lib/auth/validation";

/** Typed wrapper around the Fastify /api/auth endpoints. */
export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    apiClient.post<{ user: PublicUser; token: string }>("/auth/register", body),

  login: (body: { email: string; password: string }) =>
    apiClient.post<{ user: PublicUser; token: string }>("/auth/login", body),

  me: (signal?: AbortSignal) =>
    apiClient.get<{ user: PublicUser }>("/auth/me", signal ? { signal } : {}),

  logout: () => apiClient.post<{ ok: true }>("/auth/logout"),
};
