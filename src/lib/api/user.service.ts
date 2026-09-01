import { apiClient } from "./client";
import type { PublicUser } from "@/lib/auth/validation";

/** Typed wrapper around the Fastify /api/users endpoints. */
export const userApi = {
  profile: (signal?: AbortSignal) =>
    apiClient.get<{ user: PublicUser }>("/users/me", signal ? { signal } : {}),

  updateProfile: (body: {
    username?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  }) => apiClient.patch<{ user: PublicUser }>("/users/me", body),

  updateEmail: (body: { email: string; currentPassword: string }) =>
    apiClient.patch<{ user: PublicUser }>("/users/me/email", body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<{ ok: true }>("/users/me/password", body),

  deleteAccount: (body: { currentPassword: string }) =>
    apiClient.delete<{ ok: true }>("/users/me", { body }),
};
