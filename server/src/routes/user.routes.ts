import type { FastifyInstance } from "fastify";

import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";

/** Route layer — wiring only. Every route here requires a session. */
export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/me", userController.profile);
  app.patch("/me", userController.updateProfile);
  app.patch("/me/email", userController.updateEmail);
  app.patch("/me/password", userController.changePassword);
  app.delete("/me", userController.deleteAccount);
}
