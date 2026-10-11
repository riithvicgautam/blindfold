import { Router } from "express";

import { query } from "../db/index.js";
import { optionalAuth } from "../middleware/auth.js";
import { badRequest } from "../middleware/errors.js";
import { phrase } from "../services/ai.js";
import { generateHint } from "../services/hints.js";
import { applyPenalty, penaltyFor, STARTING_SCORE } from "../services/penalties.js";

const router = Router();
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * POST /api/coach/hint
 * Flow: question → chess.js reads FEN → deterministic clue → penalty → optional LLM rephrase.
 */
router.post("/hint", optionalAuth, async (req, res) => {
  const { fen, question, previous, sessionId } = req.body ?? {};
  if (typeof fen !== "string" || fen.length < 10 || fen.length > 120) throw badRequest("A valid position (FEN) is required.");
  if (typeof question !== "string" || !question.trim() || question.length > 300) throw badRequest("Ask a question.");
  const hintsUsed = Number.isInteger(req.body.hintsUsed) && req.body.hintsUsed >= 0 ? req.body.hintsUsed : 0;
  const score = Number.isFinite(req.body.score) ? Math.min(Math.max(req.body.score, 0), STARTING_SCORE) : STARTING_SCORE;
  const prev =
    previous && typeof previous.topicKey === "string" && Number.isInteger(previous.level) ? previous : undefined;

  const result = generateHint({ fen, question: question.trim(), previous: prev });

  if (result.kind !== "hint") {
    return res.json({ ...result, hintsUsed, score, penalty: 0 });
  }

  const { clue } = result;
  const penalty = penaltyFor(clue.level, prev, clue.topicKey);
  const nextHints = hintsUsed + (penalty > 0 ? 1 : 0);
  const phrased = await phrase(clue.text);

  // Record the hint for signed-in players. Never let this break gameplay.
  if (req.userId && penalty > 0) {
    const sid = typeof sessionId === "string" && UUID.test(sessionId) ? sessionId : null;
    const responseTime = Number.isInteger(req.body.responseMs) ? Math.min(Math.max(req.body.responseMs, 0), 3_600_000) : 0;
    query(
      `INSERT INTO review_events (user_id, session_id, event_type, correct, hint_used, response_time)
       SELECT $1, s.id, 'hint', false, true, $3
       FROM (SELECT $2::uuid AS id) x LEFT JOIN study_sessions s ON s.id = x.id AND s.user_id = $1`,
      [req.userId, sid, responseTime],
    ).catch((err) => console.warn("Could not record hint:", err.message));
  }

  res.json({
    kind: "hint",
    text: phrased.text,
    source: phrased.source,
    topicKey: clue.topicKey,
    level: clue.level,
    maxLevel: clue.maxLevel,
    hintsUsed: nextHints,
    penalty,
    score: applyPenalty(score, penalty),
  });
});

export default router;
