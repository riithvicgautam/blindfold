import type { FastifyReply, FastifyRequest } from "fastify";

import { env, sessionCookieOptions } from "../config/env.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { authService } from "../services/auth.service.js";
import { unauthorized } from "../utils/errors.js";
import { parseOrThrow } from "../utils/validate.js";

/**
 * Controller layer — HTTP concerns only: validation, cookies, status codes.
 * No business logic.
 */
export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(registerSchema, request.body);
    const { user, claims } = await authService.register(input);
    const token = await reply.jwtSign(claims);

    return reply
      .setCookie(env.COOKIE_NAME, token, sessionCookieOptions)
      .code(201)
      .send({ user, token });
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(loginSchema, request.body);
    const { user, claims } = await authService.login(input);
    const token = await reply.jwtSign(claims);

    return reply
      .setCookie(env.COOKIE_NAME, token, sessionCookieOptions)
      .code(200)
      .send({ user, token });
  },

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    return reply
      .clearCookie(env.COOKIE_NAME, { ...sessionCookieOptions, maxAge: undefined })
      .code(200)
      .send({ ok: true });
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    if (!request.currentUser) throw unauthorized();
    const user = await authService.currentUser(request.currentUser);
    return reply.code(200).send({ user });
  },
};
