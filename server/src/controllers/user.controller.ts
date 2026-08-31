import type { FastifyReply, FastifyRequest } from "fastify";

import { env, sessionCookieOptions } from "../config/env.js";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateEmailSchema,
  updateProfileSchema,
} from "../schemas/user.schema.js";
import { userService } from "../services/user.service.js";
import { unauthorized } from "../utils/errors.js";
import { parseOrThrow } from "../utils/validate.js";

function requireClaims(request: FastifyRequest) {
  if (!request.currentUser) throw unauthorized();
  return request.currentUser;
}

/** Controller layer — HTTP concerns only. No business logic. */
export const userController = {
  async profile(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const user = await userService.profile(claims.sub);
    return reply.code(200).send({ user });
  },

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const input = parseOrThrow(updateProfileSchema, request.body);
    const { user, claims: next } = await userService.updateProfile(claims.sub, input);

    // Username lives in the token, so re-issue the session after an update.
    const token = await reply.jwtSign(next);
    return reply
      .setCookie(env.COOKIE_NAME, token, sessionCookieOptions)
      .code(200)
      .send({ user, token });
  },

  async updateEmail(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const input = parseOrThrow(updateEmailSchema, request.body);
    const { user, claims: next } = await userService.updateEmail(claims.sub, input);

    const token = await reply.jwtSign(next);
    return reply
      .setCookie(env.COOKIE_NAME, token, sessionCookieOptions)
      .code(200)
      .send({ user, token });
  },

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const input = parseOrThrow(changePasswordSchema, request.body);
    await userService.changePassword(claims.sub, input);
    return reply.code(200).send({ ok: true });
  },

  async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const input = parseOrThrow(deleteAccountSchema, request.body);
    await userService.deleteAccount(claims.sub, input);

    return reply
      .clearCookie(env.COOKIE_NAME, { ...sessionCookieOptions, maxAge: undefined })
      .code(200)
      .send({ ok: true });
  },
};
