import Fastify, { type FastifyInstance } from "fastify";

import { env, isProduction } from "./config/env.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import cookiePlugin from "./plugins/cookie.plugin.js";
import corsPlugin from "./plugins/cors.plugin.js";
import jwtPlugin from "./plugins/jwt.plugin.js";
import prismaPlugin from "./plugins/prisma.plugin.js";
import { registerRoutes } from "./routes/index.js";

/** Builds a fully configured Fastify instance (also handy for tests). */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(isProduction
        ? {}
        : { transport: { target: "pino-pretty", options: { colorize: true } } }),
    },
    trustProxy: true,
  });

  registerErrorHandler(app);

  await app.register(corsPlugin);
  await app.register(cookiePlugin);
  await app.register(jwtPlugin);
  await app.register(prismaPlugin);

  await app.register(registerRoutes, { prefix: "/api" });

  return app;
}
