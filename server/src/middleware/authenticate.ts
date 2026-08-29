import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorized } from "../utils/errors.js";

/**
 * Authentication middleware (used as a Fastify preHandler).
 * Accepts the httpOnly session cookie or an `Authorization: Bearer` header,
 * and puts the verified claims on `request.currentUser`.
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const claims = await request.jwtVerify();
    request.currentUser = claims;
  } catch {
    throw unauthorized("Your session has expired. Please sign in again.");
  }
}

/** Non-blocking variant: attaches user context when present, never rejects. */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    request.currentUser = await request.jwtVerify();
  } catch {
    request.currentUser = undefined;
  }
}
