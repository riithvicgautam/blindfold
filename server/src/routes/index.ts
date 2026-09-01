import type { FastifyInstance } from "fastify";

import { analyticsRoutes } from "./analytics.routes.js";
import { authRoutes } from "./auth.routes.js";
import { healthRoutes } from "./health.routes.js";
import { userRoutes } from "./user.routes.js";

/** Mounts every API module under a versionless /api prefix. */
export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(analyticsRoutes, { prefix: "/analytics" });
}
