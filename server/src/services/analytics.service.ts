import { analyticsRepository } from "../repositories/analytics.repository.js";
import type { ActivityItem, AnalyticsOverview, DailyPoint } from "../types/index.js";

/**
 * Analytics service.
 *
 * The persistence layer (study sessions, review events, hint usage, durations)
 * is real; the aggregate figures are still deterministic mocks so the frontend
 * can be built against the final response shape. Once gameplay starts recording
 * events, only the private `mock*` helpers below get replaced by repository
 * aggregations — the public contract stays identical.
 */

/** Stable pseudo-random generator so mocked numbers don't jump per request. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1000) / 1000;
  };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export const analyticsService = {
  async overview(userId: string): Promise<AnalyticsOverview> {
    const rand = seeded(userId);
    const realReviews = await analyticsRepository.countReviewEvents(userId).catch(() => 0);

    return {
      studyStreakDays: 3 + Math.round(rand() * 9),
      studyTimeMinutes: 120 + Math.round(rand() * 300),
      cardsReviewed: realReviews + 40 + Math.round(rand() * 260),
      accuracyPercent: 68 + Math.round(rand() * 26),
      hintsUsed: Math.round(rand() * 18),
      sessionsThisWeek: 2 + Math.round(rand() * 6),
    };
  },

  async activity(userId: string, limit = 6): Promise<ActivityItem[]> {
    const stored = await analyticsRepository.listReviewEvents(userId, limit).catch(() => []);
    if (stored.length > 0) {
      return stored.map((event) => ({
        id: event.id,
        kind: "review" as const,
        title: event.correct ? "Recall correct" : "Recall missed",
        detail: `${event.kind} · ${Math.round(event.responseMs / 100) / 10}s${
          event.hintUsed ? " · hint used" : ""
        }`,
        occurredAt: event.occurredAt.toISOString(),
      }));
    }

    const rand = seeded(`${userId}:activity`);
    const samples: Array<Pick<ActivityItem, "kind" | "title" | "detail">> = [
      { kind: "session", title: "Blindfold game finished", detail: "34 moves · 18 min" },
      { kind: "review", title: "Position recall", detail: "12 of 14 squares correct" },
      { kind: "milestone", title: "Streak extended", detail: "Practised for a fourth day" },
      { kind: "session", title: "Endgame drill", detail: "K+P vs K · 9 min" },
      { kind: "review", title: "Knight path recall", detail: "8 of 10 correct · 1 hint" },
      { kind: "milestone", title: "Personal best accuracy", detail: "92% in a single session" },
    ];

    return samples.slice(0, limit).map((sample, index) => ({
      id: `mock-${index}`,
      ...sample,
      occurredAt: isoDaysAgo(index + Math.round(rand() * 1)),
    }));
  },

  async daily(userId: string, days = 7): Promise<DailyPoint[]> {
    const rand = seeded(`${userId}:daily`);
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - (days - 1 - i));
      return {
        date: date.toISOString().slice(0, 10),
        minutes: 10 + Math.round(rand() * 45),
        reviews: 5 + Math.round(rand() * 40),
        accuracyPercent: 62 + Math.round(rand() * 32),
      };
    });
  },
};
