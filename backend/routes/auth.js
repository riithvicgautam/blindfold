import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { Router } from "express";

import { config, cookieOptions } from "../config.js";
import { query } from "../db/index.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { badRequest, conflict, HttpError, unauthorized } from "../middleware/errors.js";
import { findByEmail, findById, findByUsername, toPublicUser } from "../services/users.js";
import { check, normEmail, rules } from "../services/validate.js";

const router = Router();
const BCRYPT_ROUNDS = 12;
// Used when the email doesn't exist so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

function startSession(res, user) {
  const token = signToken(user);
  res.cookie(config.cookieName, token, cookieOptions);
  return token;
}

router.post("/register", async (req, res) => {
  check(req.body, { username: rules.username, email: rules.email, password: rules.password });
  const username = req.body.username.trim();
  const email = normEmail(req.body.email);

  if (await findByEmail(email)) throw conflict("An account with that email already exists.");
  if (await findByUsername(username)) throw conflict("That username is taken.");

  const hash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  const { rows } = await query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [username, email, hash],
  );
  const user = toPublicUser(rows[0]);
  const token = startSession(res, user);
  res.status(201).json({ user, token });
});

router.post("/login", async (req, res) => {
  check(req.body, { email: rules.email, password: rules.present("your password") });
  const row = await findByEmail(normEmail(req.body.email));
  const ok = await bcrypt.compare(req.body.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) throw new HttpError(401, "invalid_credentials", "That email or password is not right.");

  const user = toPublicUser(row);
  const token = startSession(res, user);
  res.json({ user, token });
});

router.post("/logout", (_req, res) => {
  const { maxAge, ...opts } = cookieOptions;
  res.clearCookie(config.cookieName, opts).json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const row = await findById(req.userId);
  if (!row) throw unauthorized("This account no longer exists.");
  res.json({ user: toPublicUser(row) });
});

const hashToken = (t) => createHash("sha256").update(t).digest("hex");

router.post("/forgot-password", async (req, res) => {
  check(req.body, { email: rules.email });
  const row = await findByEmail(normEmail(req.body.email));
  if (row) {
    const token = randomBytes(32).toString("base64url");
    await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [row.id]);
    await query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 minutes')",
      [row.id, hashToken(token)],
    );
    // No email provider yet: the link is logged so it can be swapped for a send later.
    console.info(`[password-reset] ${config.corsOrigins[0]}/reset-password?token=${token}`);
  }
  // Same answer either way so accounts can't be discovered.
  res.json({ ok: true, message: "If an account exists for that email, a reset link is on its way." });
});

router.post("/reset-password", async (req, res) => {
  check(req.body, { token: rules.present("the reset token"), password: rules.password });
  const { rows } = await query(
    "DELETE FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > now() RETURNING user_id",
    [hashToken(req.body.token)],
  );
  if (!rows[0]) throw badRequest("This reset link is invalid or has expired. Please request a new one.");

  const hash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [hash, rows[0].user_id]);
  res.json({ ok: true });
});

export default router;
