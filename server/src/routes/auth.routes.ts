import type { FastifyInstance } from "fastify";

import { authController } from "../controllers/auth.controller.js";
import { passwordResetController } from "../controllers/password-reset.controller.js";
import { authenticate } from "../middleware/authenticate.js";

/** Route layer — wiring only. */
export async function authRoutes(app: FastifyInstance) {
  app.post("/register", authController.register);
  app.post("/login", authController.login);
  app.post("/logout", authController.logout);
  app.get("/me", { preHandler: authenticate }, authController.me);

  app.post("/forgot-password", passwordResetController.forgot);
  app.post("/reset-password", passwordResetController.reset);
}
