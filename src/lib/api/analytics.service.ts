import { apiClient } from "./client";

export type AnalyticsOverview = {
  studyStreakDays: number;
  studyTimeMinutes: number;
  cardsReviewed: number;
  accuracyPercent: number;
  hintsUsed: number;
  sessionsThisWeek: number;
};

export type ActivityItem = {
  id: string;
  kind: "session" | "review" | "milestone";
  title: string;
  detail: string;
  occurredAt: string;
};

export type DailyPoint = {
  date: string;
  minutes: number;
  reviews: number;
  accuracyPercent: number;
};

/** Typed wrapper around the Fastify /api/analytics endpoints. */
export const analyticsApi = {
  overview: (signal?: AbortSignal) =>
    apiClient.get<{ overview: AnalyticsOverview }>(
      "/analytics/overview",
      signal ? { signal } : {},
    ),

  activity: (signal?: AbortSignal) =>
    apiClient.get<{ activity: ActivityItem[] }>("/analytics/activity", signal ? { signal } : {}),

  daily: (signal?: AbortSignal) =>
    apiClient.get<{ daily: DailyPoint[] }>("/analytics/daily", signal ? { signal } : {}),
};
