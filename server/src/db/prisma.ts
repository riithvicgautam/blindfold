import { PrismaClient } from "@prisma/client";

import { env, isProduction } from "../config/env.js";

/**
 * A single Prisma client per process. Reused across hot reloads in development
 * so `tsx watch` does not exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error"] : ["error", "warn"],
    datasources: { db: { url: env.DATABASE_URL } },
  });

if (!isProduction) globalForPrisma.prisma = prisma;

export type Database = PrismaClient;
