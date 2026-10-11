import pg from "pg";

import { config } from "../config.js";

/** One shared connection pool. Every query in the app goes through `query`. */
let pool = new pg.Pool({ connectionString: config.databaseUrl });

pool.on("error", (err) => console.error("Postgres pool error:", err.message));

export function query(text, params = []) {
  return pool.query(text, params);
}

/** Lets tests swap in a different pool. */
export function setPool(next) {
  pool = next;
}

export function closePool() {
  return pool.end();
}
