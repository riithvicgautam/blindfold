import "@fastify/jwt";

/** Claims embedded in the signed session token. */
export type SessionClaims = {
  sub: string;
  username: string;
  email: string;
};

/** The user shape that is safe to return over the wire. */
export type PublicUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Aggregated analytics returned to the dashboard. */
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

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionClaims;
    user: SessionClaims;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    /** Populated by the authenticate middleware on protected routes. */
    currentUser?: SessionClaims;
  }
}
