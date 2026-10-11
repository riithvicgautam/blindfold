import bcrypt from "bcryptjs";
import { Router } from "express";

import { config, cookieOptions } from "../config.js";
import { query } from "../db/index.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { badRequest, conflict, invalidInput, unauthorized } from "../middleware/errors.js";
import { findByEmail, findById, findByUsername, toPublicUser } from "../services/users.js";
import { check, normEmail, rules } from "../services/validate.js";

const router = Router();
router.use(requireAuth);

async function currentUser(req) {
  const row = await findById(req.userId);
  if (!row) throw unauthorized("This account no longer exists.");
  return row;
}

async function confirmPassword(row, password) {
  if (typeof password !== "string" || !(await bcrypt.compare(password, row.password_hash))) {
    throw invalidInput({ currentPassword: ["That password is not right."] });
  }
}

router.get("/me", async (req, res) => {
  res.json({ user: toPublicUser(await currentUser(req)) });
});

router.patch("/me", async (req, res) => {
  const row = await currentUser(req);
  const { username, displayName, avatarUrl } = req.body ?? {};
  if (username === undefined && displayName === undefined && avatarUrl === undefined) {
    throw badRequest("Nothing to update.");
  }
  if (username !== undefined) {
    check({ username }, { username: rules.username });
    const taken = await findByUsername(username.trim());
    if (taken && taken.id !== row.id) throw conflict("That username is taken.");
  }
  if (displayName != null && (typeof displayName !== "string" || !displayName.trim() || displayName.length > 64)) {
    throw invalidInput({ displayName: ["Display name must be 1–64 characters."] });
  }
  if (avatarUrl != null && (typeof avatarUrl !== "string" || avatarUrl.length > 500_000)) {
    throw invalidInput({ avatarUrl: ["That image is too large. Please pick a smaller one."] });
  }

  const { rows } = await query(
    `UPDATE users SET
       username     = COALESCE($2, username),
       display_name = CASE WHEN $3 THEN $4 ELSE display_name END,
       avatar_url   = CASE WHEN $5 THEN $6 ELSE avatar_url END,
       updated_at   = now()
     WHERE id = $1 RETURNING *`,
    [row.id, username?.trim() ?? null, displayName !== undefined, displayName?.trim() || null, avatarUrl !== undefined, avatarUrl || null],
  );
  const user = toPublicUser(rows[0]);
  res.cookie(config.cookieName, signToken(user), cookieOptions).json({ user });
});

router.patch("/me/email", async (req, res) => {
  check(req.body, { email: rules.email });
  const row = await currentUser(req);
  await confirmPassword(row, req.body.currentPassword);
  const email = normEmail(req.body.email);
  const taken = await findByEmail(email);
  if (taken && taken.id !== row.id) throw conflict("An account with that email already exists.");

  // Reset verification so an email-confirmation step can be added later.
  const { rows } = await query(
    "UPDATE users SET email = $2, email_verified = false, updated_at = now() WHERE id = $1 RETURNING *",
    [row.id, email],
  );
  res.json({ user: toPublicUser(rows[0]) });
});

router.patch("/me/password", async (req, res) => {
  check(req.body, { newPassword: rules.password });
  const row = await currentUser(req);
  await confirmPassword(row, req.body.currentPassword);
  if (req.body.currentPassword === req.body.newPassword) {
    throw invalidInput({ newPassword: ["Choose a password different from your current one."] });
  }
  const hash = await bcrypt.hash(req.body.newPassword, 12);
  await query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [row.id, hash]);
  await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [row.id]);
  res.json({ ok: true });
});

router.delete("/me", async (req, res) => {
  const row = await currentUser(req);
  await confirmPassword(row, req.body?.currentPassword);
  await query("DELETE FROM users WHERE id = $1", [row.id]); // cascades to sessions/events
  const { maxAge, ...opts } = cookieOptions;
  res.clearCookie(config.cookieName, opts).json({ ok: true });
});

export default router;
