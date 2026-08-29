import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { prisma } from "../db/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

/** Connects Prisma on boot and disconnects cleanly on shutdown. */
export default fp(async function prismaPlugin(app: FastifyInstance) {
  await prisma.$connect();
  app.decorate("prisma", prisma);
  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
