import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { PublicUser } from "./validation";

type ApiError = { code: string; message: string; details?: Record<string, string[]> };

export class AuthRequestError extends Error {
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "AuthRequestError";
    this.code = error.code;
    if (error.details) this.details = error.details;
  }
}

/**
 * All auth requests are same-origin and rely on the httpOnly session cookie
 * issued by the API, so the JWT is never readable by scripts.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json" },
    ...init,
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: ApiError })
    | null;

  if (!response.ok) {
    throw new AuthRequestError(
      payload?.error ?? { code: "server_error", message: "Something went wrong." },
    );
  }
  return payload as T;
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    request<{ user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ user: PublicUser }>("/api/auth/me"),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
};

type AuthContextValue = {
  user: PublicUser | null;
  status: "loading" | "authenticated" | "anonymous";
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      refresh,
      async register(input) {
        const { user: created } = await authApi.register(input);
        setUser(created);
        setStatus("authenticated");
      },
      async login(input) {
        const { user: signedIn } = await authApi.login(input);
        setUser(signedIn);
        setStatus("authenticated");
      },
      async logout() {
        await authApi.logout().catch(() => undefined);
        setUser(null);
        setStatus("anonymous");
      },
    }),
    [user, status, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
