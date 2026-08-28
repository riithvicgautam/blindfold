import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/lib/auth/session";

export function AccountMenu() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (status === "loading") {
    return <span className="h-7 w-20 animate-pulse rounded-lg bg-secondary" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        to="/auth"
        search={{ redirect: undefined }}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm">
        <span className="grid size-5 place-items-center rounded-md bg-secondary text-[11px] font-semibold text-primary">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate text-foreground">{user.username}</span>
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await logout();
          setBusy(false);
          void navigate({ to: "/", replace: true });
        }}
        className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}
