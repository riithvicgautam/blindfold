import assert from "node:assert/strict";
import { test } from "node:test";

// Point at a port nothing listens on to simulate the database being down.
process.env.DATABASE_URL = "postgresql://postgres@127.0.0.1:1/none?sslmode=disable";

test("database down → 503 with a friendly message, no internals", async () => {
  const { createApp } = await import("../app.js");
  const server = createApp().listen(0);
  const res = await fetch(`http://localhost:${server.address().port}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "a@b.co", password: "whatever1" }),
  });
  const body = await res.json();
  server.close();
  assert.equal(res.status, 503);
  assert.equal(body.error.code, "db_unavailable");
  process.exit(0);
});
