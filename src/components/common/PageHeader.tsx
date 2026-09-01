import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AccountMenu } from "@/components/auth/AccountMenu";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/play", label: "Play" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
] as const;

/** Shared top bar for every signed-in screen. */
export function AppNav() {
  return (
    <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-secondary text-[13px] font-semibold text-primary">
            ♞
          </span>
          <span className="text-sm font-semibold tracking-tight">Blindfold</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <AccountMenu />
    </header>
  );
}

/** Page title block shared by dashboard, profile and settings. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="animate-fade flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
      {action}
    </div>
  );
}
