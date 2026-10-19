import { apiClient } from "./client";

/** @typedef {import("@/lib/auth/validation").PublicUser} PublicUser */

export const authApi = {
  /** @param {{ username: string, email: string, password: string }} body @returns {Promise<{ user: PublicUser }>} */
  register: (body) => apiClient.post("/auth/register", body),
  /** @param {{ email: string, password: string }} body @returns {Promise<{ user: PublicUser }>} */
  login: (body) => apiClient.post("/auth/login", body),
  /** @param {AbortSignal} [signal] @returns {Promise<{ user: PublicUser }>} */
  me: (signal) => apiClient.get("/auth/me", signal ? { signal } : {}),
  logout: () => apiClient.post("/auth/logout"),
  /** @param {{ email: string }} body @returns {Promise<{ ok: true, message: string }>} */
  forgotPassword: (body) => apiClient.post("/auth/forgot-password", body),
  /** @param {{ token: string, password: string }} body */
  resetPassword: (body) => apiClient.post("/auth/reset-password", body),
};
