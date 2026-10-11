import { createApp } from "./app.js";
import { config } from "./config.js";
import { closePool } from "./db/index.js";

if (!config.databaseUrl) console.warn("DATABASE_URL is not set — database routes will fail.");

const server = createApp().listen(config.port, () => {
  console.log(`Blindfold API listening on http://localhost:${config.port}/api`);
});

function shutdown() {
  server.close(() => closePool().finally(() => process.exit(0)));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
