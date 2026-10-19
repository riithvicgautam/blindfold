import { apiClient } from "./client";

/** @typedef {import("@/lib/auth/validation").PublicUser} PublicUser */

export const userApi = {
  /** @param {AbortSignal} [signal] @returns {Promise<{ user: PublicUser }>} */
  profile: (signal) => apiClient.get("/users/me", signal ? { signal } : {}),
  /** @param {{ username?: string, displayName?: string | null, avatarUrl?: string | null }} body @returns {Promise<{ user: PublicUser }>} */
  updateProfile: (body) => apiClient.patch("/users/me", body),
  /** @param {{ email: string, currentPassword: string }} body @returns {Promise<{ user: PublicUser }>} */
  updateEmail: (body) => apiClient.patch("/users/me/email", body),
  /** @param {{ currentPassword: string, newPassword: string }} body */
  changePassword: (body) => apiClient.patch("/users/me/password", body),
  /** @param {{ currentPassword: string }} body */
  deleteAccount: (body) => apiClient.delete("/users/me", { body }),
};
