import { Router } from "express";

import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

/** Dashboard numbers, computed from real study_sessions and review_events rows. */
const router = Router();
router.use(requireAuth);

const minutes = "COALESCE(EXTRACT(EPOCH FROM (COALESCE(ended_at, started_at) - started_at)) / 60, 0)";

router.get("/overview", async (req, res) => {
  const { rows } = await query(
    `SELECT
       COALESCE(ROUND(SUM(${minutes})), 0)::int                                     AS minutes,
       COALESCE(SUM(moves_played), 0)::int                                          AS moves,
       COALESCE(ROUND(AVG(accuracy)), 0)::int                                       AS accuracy,
       COALESCE(SUM(hints_used), 0)::int                                            AS hints,
       COUNT(*) FILTER (WHERE started_at > now() - interval '7 days')::int          AS week
     FROM study_sessions WHERE user_id = $1`,
    [req.userId],
  );
  const days = await query(
    "SELECT DISTINCT (started_at AT TIME ZONE 'UTC')::date AS d FROM study_sessions WHERE user_id = $1 ORDER BY d DESC LIMIT 366",
    [req.userId],
  );
  // Streak = consecutive days with a session, ending today or yesterday.
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const daySet = new Set(days.rows.map((r) => new Date(r.d).toISOString().slice(0, 10)));
  if (!daySet.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const r = rows[0];
  res.json({
    overview: {
      studyStreakDays: streak,
      studyTimeMinutes: r.minutes,
      cardsReviewed: r.moves, // moves recalled without a board
      accuracyPercent: r.accuracy,
      hintsUsed: r.hints,
      sessionsThisWeek: r.week,
    },
  });
});

router.get("/activity", async (req, res) => {
  const { rows } = await query(
    `SELECT id, started_at, moves_played, hints_used, accuracy, ROUND(${minutes})::int AS mins
     FROM study_sessions WHERE user_id = $1 AND ended_at IS NOT NULL ORDER BY started_at DESC LIMIT 6`,
    [req.userId],
  );
  res.json({
    activity: rows.map((s) => ({
      id: s.id,
      kind: "session",
      title: "Blindfold game",
      detail: `${s.moves_played} moves · ${s.mins} min · ${s.hints_used} hint${s.hints_used === 1 ? "" : "s"}${
        s.accuracy != null ? ` · ${Math.round(Number(s.accuracy))}% accuracy` : ""
      }`,
      occurredAt: new Date(s.started_at).toISOString(),
    })),
  });
});

router.get("/daily", async (req, res) => {
  const { rows } = await query(
    `SELECT d::date AS date,
            COALESCE(ROUND(SUM(${minutes.replaceAll("ended_at", "s.ended_at").replaceAll("started_at", "s.started_at")})), 0)::int AS minutes,
            COALESCE(SUM(s.moves_played), 0)::int AS reviews,
            COALESCE(ROUND(AVG(s.accuracy)), 0)::int AS accuracy
     FROM generate_series((now() AT TIME ZONE 'UTC')::date - 6, (now() AT TIME ZONE 'UTC')::date, interval '1 day') d
     LEFT JOIN study_sessions s ON s.user_id = $1 AND (s.started_at AT TIME ZONE 'UTC')::date = d::date
     GROUP BY d ORDER BY d`,
    [req.userId],
  );
  res.json({
    daily: rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      minutes: r.minutes,
      reviews: r.reviews,
      accuracyPercent: r.accuracy,
    })),
  });
});

export default router;
