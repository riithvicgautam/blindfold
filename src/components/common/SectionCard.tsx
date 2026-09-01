import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A titled panel used across profile, settings and dashboard screens. */
export function SectionCard({
  title,
  description,
  action,
  footer,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-surface", className)}
      aria-label={title}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </header>

      {children && <div className="px-6 py-5">{children}</div>}

      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </section>
  );
}
