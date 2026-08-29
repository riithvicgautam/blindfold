import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env.js";

export default fp(async function cookiePlugin(app: FastifyInstance) {
  await app.register(cookie, { secret: env.JWT_SECRET });
});
