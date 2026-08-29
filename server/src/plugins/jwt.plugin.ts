import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env.js";

/**
 * JWT signing/verification. Tokens are read from the httpOnly session cookie
 * first and fall back to the Authorization header for non-browser clients.
 */
export default fp(async function jwtPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN, iss: "blindfold", aud: "blindfold-app" },
    verify: { allowedIss: "blindfold", allowedAud: "blindfold-app" },
    cookie: { cookieName: env.COOKIE_NAME, signed: false },
  });
});
