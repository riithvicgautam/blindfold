import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authApi } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";
import type { PublicUser } from "./validation";

export { ApiError as AuthRequestError };

type AuthContextValue = {
  user: PublicUser | null;
  status: "loading" | "authenticated" | "anonymous";
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Replace the cached user after a profile mutation. */
  setUser: (user: PublicUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state for the app. The JWT itself lives in an httpOnly cookie set by
 * the Fastify backend, so it is never readable by scripts; this provider only
 * mirrors the resolved user for React consumers.
 */
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
      setUser(next) {
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
      },
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
