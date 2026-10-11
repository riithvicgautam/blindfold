import { Router } from "express";

import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { badRequest, HttpError } from "../middleware/errors.js";

/** A study session = one blindfold game by a signed-in user. */
const router = Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  const { rows } = await query("INSERT INTO study_sessions (user_id) VALUES ($1) RETURNING id, started_at", [req.userId]);
  res.status(201).json({ session: { id: rows[0].id, startedAt: rows[0].started_at } });
});

router.patch("/:id", async (req, res) => {
  const { movesPlayed, hintsUsed, accuracy } = req.body ?? {};
  const int = (v) => Number.isInteger(v) && v >= 0 && v < 10_000;
  if (!int(movesPlayed) || !int(hintsUsed)) throw badRequest("movesPlayed and hintsUsed must be whole numbers.");
  if (accuracy != null && !(typeof accuracy === "number" && accuracy >= 0 && accuracy <= 100)) {
    throw badRequest("accuracy must be between 0 and 100.");
  }
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw badRequest("Invalid session id.");

  const { rowCount } = await query(
    `UPDATE study_sessions SET ended_at = COALESCE(ended_at, now()), moves_played = $3, hints_used = $4, accuracy = $5
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId, movesPlayed, hintsUsed, accuracy ?? null],
  );
  if (!rowCount) throw new HttpError(404, "not_found", "Session not found.");
  res.json({ ok: true });
});

export default router;
