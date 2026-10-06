import type { FastifyInstance } from "fastify";

import { coachController } from "../controllers/coach.controller.js";
import { optionalAuthenticate } from "../middleware/authenticate.js";

/** Coach works signed-out; hints are only persisted for signed-in users. */
export async function coachRoutes(app: FastifyInstance) {
  app.addHook("preHandler", optionalAuthenticate);
  app.post("/hint", coachController.hint);
}
