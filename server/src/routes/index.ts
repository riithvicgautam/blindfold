import type { FastifyInstance } from "fastify";

import { authRoutes } from "./auth.routes.js";
import { healthRoutes } from "./health.routes.js";

/** Mounts every API module under a versionless /api prefix. */
export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
}
