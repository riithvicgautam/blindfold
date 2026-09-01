import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Compact metric tile used by the dashboard quick stats grid. */
export function StatsCard({
  label,
  value,
  hint,
  icon,
  accent = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {icon && (
          <span className="grid size-7 place-items-center rounded-lg bg-secondary text-primary">
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-[-0.02em]",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
