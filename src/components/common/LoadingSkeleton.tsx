import { cn } from "@/lib/utils";

/** Single shimmering block. */
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block animate-pulse rounded-lg bg-secondary", className)}
    />
  );
}

/** Convenience: a stack of skeleton lines. */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <LoadingSkeleton key={i} className={i === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
      ))}
    </div>
  );
}

/** Convenience: a grid of stat-card sized skeletons. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <LoadingSkeleton key={i} className="h-[104px] rounded-2xl" />
      ))}
    </div>
  );
}
