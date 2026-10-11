import { readFile } from "node:fs/promises";

import { closePool, query } from "./index.js";

/** Applies db/schema.sql. Usage: npm run db:migrate */
const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
try {
  await query(sql);
  console.log("Database schema is up to date.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
