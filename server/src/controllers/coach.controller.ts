import type { FastifyReply, FastifyRequest } from "fastify";

import { coachHintSchema } from "../schemas/coach.schema.js";
import { coachService } from "../services/coach.service.js";
import { parseOrThrow } from "../utils/validate.js";

/** Controller layer — HTTP concerns only. */
export const coachController = {
  async hint(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(coachHintSchema, request.body);
    const result = await coachService.hint(input, request.currentUser?.sub);
    return reply.code(200).send(result);
  },
};
