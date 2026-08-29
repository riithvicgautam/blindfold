import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { isProduction } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { fieldErrors } from "../utils/validate.js";

/** Centralised error handling — every route funnels failures through here. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) =>
    reply.code(404).send({
      error: { code: "not_found", message: `No route for ${request.method} ${request.url}` },
    }),
  );

  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: "Please check the highlighted fields.",
          details: fieldErrors(error.issues),
        },
      });
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply
        .code(error.statusCode)
        .send({ error: { code: error.code ?? "request_error", message: error.message } });
    }

    request.log.error({ err: error }, "Unhandled error");
    return reply.code(500).send({
      error: {
        code: "server_error",
        message: isProduction ? "Something went wrong. Please try again." : error.message,
      },
    });
  });
}
