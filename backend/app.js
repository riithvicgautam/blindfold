import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import analyticsRoutes from "./routes/analytics.js";
import authRoutes from "./routes/auth.js";
import coachRoutes from "./routes/coach.js";
import sessionRoutes from "./routes/sessions.js";
import userRoutes from "./routes/users.js";

/** Builds the Express app (exported separately so tests can use it). */
export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" })); // avatars are small data URLs
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/coach", coachRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
