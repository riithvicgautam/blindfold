/**
 * End-to-end API tests against a real PostgreSQL database.
 * Run with: TEST_DATABASE_URL=postgres://... npm test
 * Skipped when TEST_DATABASE_URL is not set.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

const DB = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = DB || "";
process.env.AI_PROVIDER = "none";

describe("API", { skip: !DB }, () => {
  let server, base, closePool, query;
  const email = `t${Date.now()}@example.com`;
  let cookie = "";

  const call = async (method, path, body, withCookie = true) => {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", ...(withCookie && cookie ? { cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const set = res.headers.get("set-cookie");
    if (set && withCookie) cookie = set.split(";")[0];
    return { status: res.status, body: await res.json() };
  };

  before(async () => {
    const { createApp } = await import("../app.js");
    ({ closePool, query } = await import("../db/index.js"));
    server = createApp().listen(0);
    base = `http://localhost:${server.address().port}/api`;
  });
  after(async () => {
    server.close();
    await closePool();
  });

  test("register validates input", async () => {
    const r = await call("POST", "/auth/register", { username: "x", email: "bad", password: "1" });
    assert.equal(r.status, 400);
    assert.ok(r.body.error.details.username && r.body.error.details.email && r.body.error.details.password);
  });

  test("register, then me, stores a bcrypt hash", async () => {
    const r = await call("POST", "/auth/register", { username: `u${Date.now()}`, email, password: "password123" });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.email, email);
    assert.equal(r.body.user.password_hash, undefined);
    const { rows } = await query("SELECT password_hash FROM users WHERE email = $1", [email]);
    assert.match(rows[0].password_hash, /^\$2[aby]\$12\$/);
    assert.equal((await call("GET", "/auth/me")).status, 200);
  });

  test("duplicate email → 409", async () => {
    const r = await call("POST", "/auth/register", { username: `v${Date.now()}`, email, password: "password123" }, false);
    assert.equal(r.status, 409);
  });

  test("wrong password → 401, right password → 200", async () => {
    assert.equal((await call("POST", "/auth/login", { email, password: "nope-nope" }, false)).status, 401);
    assert.equal((await call("POST", "/auth/login", { email, password: "password123" })).status, 200);
  });

  test("protected route without/with bad JWT → 401", async () => {
    assert.equal((await call("GET", "/auth/me", null, false)).status, 401);
    const res = await fetch(base + "/auth/me", { headers: { authorization: "Bearer not.a.jwt" } });
    assert.equal(res.status, 401);
  });

  test("session + coach hint is recorded with penalty", async () => {
    const s = await call("POST", "/sessions");
    assert.equal(s.status, 201);
    const sessionId = s.body.session.id;
    const h = await call("POST", "/coach/hint", {
      fen: "4k3/8/8/8/8/5N2/8/4K3 w - - 0 1",
      question: "Where is my knight?",
      hintsUsed: 0,
      score: 100,
      sessionId,
    });
    assert.equal(h.body.kind, "hint");
    assert.equal(h.body.source, "template"); // no AI key → deterministic fallback
    assert.equal(h.body.score, 98);
    assert.equal(h.body.hintsUsed, 1);
    await new Promise((r) => setTimeout(r, 100));
    const { rows } = await query("SELECT count(*)::int AS n FROM review_events WHERE session_id = $1", [sessionId]);
    assert.equal(rows[0].n, 1);
    const end = await call("PATCH", `/sessions/${sessionId}`, { movesPlayed: 12, hintsUsed: 1, accuracy: 90 });
    assert.equal(end.status, 200);
    const o = await call("GET", "/analytics/overview");
    assert.equal(o.body.overview.cardsReviewed, 12);
    assert.equal(o.body.overview.studyStreakDays, 1);
  });

  test("coach rejects bad input", async () => {
    assert.equal((await call("POST", "/coach/hint", { fen: "", question: "" })).status, 400);
  });

  test("logout clears the session", async () => {
    await call("POST", "/auth/logout");
    assert.equal((await call("GET", "/auth/me")).status, 401);
  });
});
