import { apiClient } from "./client";

/**
 * @typedef {{ studyStreakDays: number, studyTimeMinutes: number, cardsReviewed: number, accuracyPercent: number, hintsUsed: number, sessionsThisWeek: number }} AnalyticsOverview
 * @typedef {{ id: string, kind: "session" | "review" | "milestone", title: string, detail: string, occurredAt: string }} ActivityItem
 * @typedef {{ date: string, minutes: number, reviews: number, accuracyPercent: number }} DailyPoint
 */

export const analyticsApi = {
  /** @param {AbortSignal} [signal] @returns {Promise<{ overview: AnalyticsOverview }>} */
  overview: (signal) => apiClient.get("/analytics/overview", signal ? { signal } : {}),
  /** @param {AbortSignal} [signal] @returns {Promise<{ activity: ActivityItem[] }>} */
  activity: (signal) => apiClient.get("/analytics/activity", signal ? { signal } : {}),
  /** @param {AbortSignal} [signal] @returns {Promise<{ daily: DailyPoint[] }>} */
  daily: (signal) => apiClient.get("/analytics/daily", signal ? { signal } : {}),
};
