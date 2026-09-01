import type { FastifyReply, FastifyRequest } from "fastify";

import { analyticsService } from "../services/analytics.service.js";
import { unauthorized } from "../utils/errors.js";

function requireClaims(request: FastifyRequest) {
  if (!request.currentUser) throw unauthorized();
  return request.currentUser;
}

/** Controller layer — HTTP concerns only. No business logic. */
export const analyticsController = {
  async overview(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const overview = await analyticsService.overview(claims.sub);
    return reply.code(200).send({ overview });
  },

  async activity(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const activity = await analyticsService.activity(claims.sub);
    return reply.code(200).send({ activity });
  },

  async daily(request: FastifyRequest, reply: FastifyReply) {
    const claims = requireClaims(request);
    const daily = await analyticsService.daily(claims.sub);
    return reply.code(200).send({ daily });
  },
};
