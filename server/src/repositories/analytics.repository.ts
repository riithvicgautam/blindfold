import type { ReviewEvent, StudySession } from "@prisma/client";

import { prisma } from "../db/prisma.js";

/**
 * Repository layer for analytics persistence.
 * The AI Coach will read/write through exactly these methods.
 */
export const analyticsRepository = {
  createSession(data: { userId: string }): Promise<StudySession> {
    return prisma.studySession.create({ data });
  },

  endSession(
    id: string,
    data: { durationSec: number; movesPlayed: number; hintsUsed: number; accuracy?: number },
  ): Promise<StudySession> {
    return prisma.studySession.update({
      where: { id },
      data: { ...data, endedAt: new Date() },
    });
  },

  listSessions(userId: string, limit = 20): Promise<StudySession[]> {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  },

  createReviewEvent(data: {
    userId: string;
    sessionId?: string | null;
    kind: string;
    correct: boolean;
    hintUsed: boolean;
    responseMs: number;
    payload?: unknown;
  }): Promise<ReviewEvent> {
    const { payload, ...rest } = data;
    return prisma.reviewEvent.create({
      data: { ...rest, payload: payload as never },
    });
  },

  listReviewEvents(userId: string, limit = 50): Promise<ReviewEvent[]> {
    return prisma.reviewEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  },

  countReviewEvents(userId: string): Promise<number> {
    return prisma.reviewEvent.count({ where: { userId } });
  },
};

export type AnalyticsRepository = typeof analyticsRepository;
