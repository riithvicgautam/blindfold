import type { FastifyInstance } from "fastify";

import { analyticsController } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";

/** Route layer — wiring only. */
export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/overview", analyticsController.overview);
  app.get("/activity", analyticsController.activity);
  app.get("/daily", analyticsController.daily);
}
