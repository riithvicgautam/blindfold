import type { FastifyReply, FastifyRequest } from "fastify";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/password-reset.schema.js";
import { passwordResetService } from "../services/password-reset.service.js";
import { parseOrThrow } from "../utils/validate.js";

/** Controller layer — HTTP concerns only. No business logic. */
export const passwordResetController = {
  async forgot(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(forgotPasswordSchema, request.body);

    await passwordResetService.request(input, ({ email, resetUrl, expiresAt }) => {
      // Swap this callback for an email provider when one is wired up.
      request.log.info(
        { email, resetUrl, expiresAt },
        "Password reset link generated (delivery not configured — logging instead of emailing)",
      );
    });

    // Always the same answer, so accounts cannot be enumerated.
    return reply.code(200).send({
      ok: true,
      message: "If an account exists for that email, a reset link is on its way.",
    });
  },

  async reset(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(resetPasswordSchema, request.body);
    await passwordResetService.reset(input);
    return reply.code(200).send({ ok: true });
  },
};
