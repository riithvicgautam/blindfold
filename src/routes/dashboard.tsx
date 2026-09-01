import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, Flame, Target, Timer } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCards, SkeletonLines } from "@/components/common/LoadingSkeleton";
import { AppNav, PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatsCard } from "@/components/common/StatsCard";
import { analyticsApi } from "@/lib/api/analytics.service";
import { useAuth } from "@/lib/auth/session";
import { displayNameOf } from "@/lib/auth/validation";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Blindfold" },
      {
        name: "description",
        content:
          "Your blindfold training at a glance: study streak, time practised, recall accuracy and recent activity.",
      },
      { property: "og:title", content: "Blindfold Dashboard" },
      {
        property: "og:description",
        content: "Track your visualization training streak, accuracy and recent sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, status } = useAuth();

  const overview = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: ({ signal }) => analyticsApi.overview(signal).then((r) => r.overview),
    enabled: status === "authenticated",
  });

  const activity = useQuery({
    queryKey: ["analytics", "activity"],
    queryFn: ({ signal }) => analyticsApi.activity(signal).then((r) => r.activity),
    enabled: status === "authenticated",
  });

  const daily = useQuery({
    queryKey: ["analytics", "daily"],
    queryFn: ({ signal }) => analyticsApi.daily(signal).then((r) => r.daily),
    enabled: status === "authenticated",
  });

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] halo" />
      <AppNav />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-6 pb-24">
        <PageHeader
          eyebrow="Welcome back"
          title={user ? `Hello, ${displayNameOf(user)}` : "Hello"}
          description="A quiet space for your visualization practice. Pick up a game, or review how the last week went."
          action={
            <Link
              to="/play"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a game
            </Link>
          }
        />

        {status !== "authenticated" ? (
          <div className="mt-10">
            <EmptyState
              title="Sign in to see your progress"
              description="Your streak, study time and accuracy are tied to your account."
              action={
                <Link
                  to="/auth"
                  search={{}}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Sign in
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10">
              {overview.isPending ? (
                <SkeletonCards />
              ) : overview.data ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    label="Study streak"
                    value={`${overview.data.studyStreakDays} days`}
                    hint="Keep it going today"
                    icon={<Flame className="size-4" />}
                    accent
                  />
                  <StatsCard
                    label="Study time"
                    value={formatMinutes(overview.data.studyTimeMinutes)}
                    hint={`${overview.data.sessionsThisWeek} sessions this week`}
                    icon={<Timer className="size-4" />}
                  />
                  <StatsCard
                    label="Cards reviewed"
                    value={overview.data.cardsReviewed.toLocaleString()}
                    hint={`${overview.data.hintsUsed} hints used`}
                    icon={<Activity className="size-4" />}
                  />
                  <StatsCard
                    label="Accuracy"
                    value={`${overview.data.accuracyPercent}%`}
                    hint="Across recall attempts"
                    icon={<Target className="size-4" />}
                  />
                </div>
              ) : (
                <EmptyState
                  title="Stats are unavailable"
                  description="We couldn't reach the training service. Try again in a moment."
                />
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <SectionCard
                title="Recent activity"
                description="The last things you practised."
              >
                {activity.isPending ? (
                  <SkeletonLines lines={5} />
                ) : activity.data && activity.data.length > 0 ? (
                  <ul className="space-y-1">
                    {activity.data.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/60"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>
                        <time
                          dateTime={item.occurredAt}
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          {relativeDay(item.occurredAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="Nothing here yet"
                    description="Play a game or run a recall drill and it will show up here."
                  />
                )}
              </SectionCard>

              <SectionCard title="This week" description="Minutes practised per day.">
                {daily.isPending ? (
                  <SkeletonLines lines={4} />
                ) : daily.data && daily.data.length > 0 ? (
                  <div className="flex h-40 items-end gap-2">
                    {daily.data.map((point) => {
                      const max = Math.max(...daily.data.map((p) => p.minutes), 1);
                      return (
                        <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-md bg-primary/70"
                            style={{ height: `${Math.max(6, (point.minutes / max) * 120)}px` }}
                            title={`${point.minutes} min · ${point.accuracyPercent}% accuracy`}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(point.date).toLocaleDateString(undefined, {
                              weekday: "narrow",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No sessions yet" />
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function relativeDay(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
